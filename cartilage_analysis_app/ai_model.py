
import torch
import numpy as np
import cv2

class ZoneDetector:
    def __init__(self):
        # We upgrade to a robust K-Means + Spatial Voting approach
        # This handles complex cases like "Black/Dark MZ" and "Greenish DZ" effectively.
        print("Initializing Advanced K-Means Zone Detector...")
        self.device = torch.device("cpu") # CPU is sufficient for this logic
        
    def detect_zones_and_colors(self, image_bgr):
        """
        Detects SZ, MZ, DZ using robust K-Means Clustering on HSV space combined with Spatial Row Voting.
        This handles:
        1. Dark MZ (Extinction) vs Bright SZ/DZ
        2. Hue transitions (Orange -> Green)
        3. Mixed "Black-Green" regions
        """
        try:
            h_img, w_img = image_bgr.shape[:2]
            
            # 1. Preprocessing & Normalization
            hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
            h_chan = hsv[:, :, 0].astype(float)
            s_chan = hsv[:, :, 1].astype(float)
            v_chan = hsv[:, :, 2].astype(float)
            
            # Normalize for K-Means (Equal weight to Hue and Intensity)
            # Hue 0-180 -> 0-1
            # V 0-255 -> 0-1
            h_norm = h_chan / 180.0
            v_norm = v_chan / 255.0
            
            # 2. Extract Valid Samples for Clustering
            # Ignore pure background (V very low) if crop has black borders
            mask = v_chan > 10 
            if not np.any(mask):
                 raise ValueError("Image appears empty or too dark.")
                 
            samples = np.column_stack((h_norm[mask], v_norm[mask])).astype(np.float32)
            
            # 3. K-Means Clustering (k=3 for SZ, MZ, DZ)
            # Use plenty of attempts to find stable clusters
            criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
            k = 3
            ret, labels, centers = cv2.kmeans(samples, k, None, criteria, 10, cv2.KMEANS_PP_CENTERS)
            
            # 4. Identify Clusters (Who is SZ, MZ, DZ?)
            # Centers: [ [h, v], [h, v], [h, v] ]
            
            # A. Sort by Intensity (V). The darkest center is predominantly MZ (Extinction)
            # However, if MZ is just transitional color, V might not be lowest.
            # But user specifically mentioned "Black Greenish region is MZ". So V is key.
            
            cluster_indices = [0, 1, 2]
            sorted_by_v = sorted(cluster_indices, key=lambda i: centers[i][1]) # Ascending V
            
            mz_cluster_idx = sorted_by_v[0] # Lowest Intensity (Darkest)
            
            # The other two are SZ and DZ. Sort them by Hue.
            remaining = sorted_by_v[1:]
            # SZ is Lower Hue (Red/Orange), DZ is Higher Hue (Green)
            if centers[remaining[0]][0] < centers[remaining[1]][0]:
                sz_cluster_idx = remaining[0]
                dz_cluster_idx = remaining[1]
            else:
                sz_cluster_idx = remaining[1]
                dz_cluster_idx = remaining[0]
                
            print(f"Cluster Config -- SZ_Center: {centers[sz_cluster_idx]}, MZ_Center: {centers[mz_cluster_idx]}, DZ_Center: {centers[dz_cluster_idx]}")
            
            # 5. Spatial Row Voting
            # Assign each ROW to a zone based on its median pixel characteristics
            # We don't just use the cluster labels because we need spatial continuity
            
            row_labels = []
            
            for y in range(h_img):
                # Get median normalized H and V for this row
                # Mask out background
                row_mask = (v_chan[y, :] > 10)
                if not np.any(row_mask):
                    row_labels.append(-1) # Background row
                    continue
                    
                row_h = np.median(h_norm[y, :][row_mask])
                row_v = np.median(v_norm[y, :][row_mask])
                
                # Find distance to each cluster center
                pixel_pt = np.array([row_h, row_v], dtype=np.float32)
                
                d_sz = np.linalg.norm(pixel_pt - centers[sz_cluster_idx])
                d_mz = np.linalg.norm(pixel_pt - centers[mz_cluster_idx]) 
                d_dz = np.linalg.norm(pixel_pt - centers[dz_cluster_idx])
                
                # Assign label (0=SZ, 1=MZ, 2=DZ) based on closest center
                dists = [d_sz, d_mz, d_dz]
                min_idx = np.argmin(dists)
                row_labels.append(min_idx)
                
            # 6. Find Boundaries from Smoothed Row Labels
            # Smooth the labels to remove noise (e.g. median filter)
            row_labels = np.array(row_labels)
            
            # Simple window vote
            smooth_labels = row_labels.copy()
            window = int(h_img * 0.05)
            if window < 3: window = 3
            
            for i in range(len(row_labels)):
                start = max(0, i - window)
                end = min(len(row_labels), i + window)
                chunk = row_labels[start:end]
                valid_chunk = chunk[chunk != -1]
                if len(valid_chunk) > 0:
                    counts = np.bincount(valid_chunk, minlength=3)
                    smooth_labels[i] = np.argmax(counts)
            
            # Find transitions
            # SZ -> MZ (Transition from 0 to 1)
            # Scan from top
            sz_boundary = 0
            found_sz_trans = False
            for y in range(int(h_img * 0.05), int(h_img * 0.6)):
                # If we see consistent MZ (1) or DZ (2) after SZ (0)
                if smooth_labels[y] != 0:
                    # check stability
                    if np.all(smooth_labels[y:y+5] != 0):
                        sz_boundary = y
                        found_sz_trans = True
                        break
            if not found_sz_trans: sz_boundary = int(h_img * 0.33)
            
            # MZ -> DZ (Transition from 1 to 2)
            # Scan from bottom up? or from SZ down
            dz_boundary = h_img
            found_dz_trans = False
            for y in range(h_img - int(h_img * 0.05), sz_boundary, -1):
                # If we see consistent MZ (1) or SZ (0) ABOVE DZ (2)
                if smooth_labels[y] != 2:
                     # This means we hit the top of the DZ block
                     dz_boundary = y
                     found_dz_trans = True
                     break
            if not found_dz_trans: dz_boundary = int(h_img * 0.66)
            
            # 7. Extract Representative Colors from Centers + Real Data
            # Map normalized centroids back to real units
            sz_hue = centers[sz_cluster_idx][0] * 180.0
            mz_hue_cen = centers[mz_cluster_idx][0] * 180.0
            dz_hue = centers[dz_cluster_idx][0] * 180.0
            
            # Refine hues by sampling the identified regions directly (ground truth)
            # SZ Region
            if sz_boundary > 0:
                roi = h_chan[0:sz_boundary, :][mask[0:sz_boundary, :]]
                if len(roi) > 0: sz_hue = np.median(roi)
                
            # MZ Region
            if dz_boundary > sz_boundary:
                roi = h_chan[sz_boundary:dz_boundary, :][mask[sz_boundary:dz_boundary, :]]
                if len(roi) > 0: mz_hue_cen = np.median(roi)
            
            # DZ Region
            if dz_boundary < h_img:
                roi = h_chan[dz_boundary:h_img, :][mask[dz_boundary:h_img, :]]
                if len(roi) > 0: dz_hue = np.median(roi)
            
            # Fallback checks
            if sz_hue > 100: sz_hue = 10.0 # Sanity check for Red wrapping
            
            return {
                'success': True,
                'sz_boundary': round((sz_boundary / h_img) * 100, 1),
                'mz_boundary': round((dz_boundary / h_img) * 100, 1),
                'sz_hue': round(sz_hue, 1),
                'mz_hue': round(mz_hue_cen, 1),
                'dz_hue': round(dz_hue, 1),
                'debug_method': 'K-Means Clustering'
            }

        except Exception as e:
            print(f"K-Means Detection Failed: {e}")
            # import traceback
            # traceback.print_exc()
            return {
                'success': False,
                'error': str(e)
            }
