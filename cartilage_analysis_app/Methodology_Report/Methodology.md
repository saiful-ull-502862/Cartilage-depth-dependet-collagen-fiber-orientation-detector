
# Methodology: Automated fiber Orientation Analysis of Articular Cartilage via Polarized Light Microscopy (PLM)

## 1. Image Acquisition and Preprocessing
The input data consists of high-resolution Polarized Light Microscopy (PLM) images of articular cartilage sections. The raw images, often in TIFF format, are first converted to standard RGB/PNG format for processing. A Region of Interest (ROI) is manually or semi-automatically cropped to isolate the cartilage depth profile, removing subchondral bone and background artifacts. To ensure robust color analysis independent of lighting variations, the images are converted from the BGR (Blue-Green-Red) color space to the HSV (Hue-Saturation-Value) color space. The Hue (H) channel represents color independent of brightness, the Saturation (S) channel represents color purity, and the Value (V) channel represents light intensity.

## 2. Automated Zone Detection via K-Means Clustering and Spatial Voting
To overcome the limitations of manual zone segmentation, we implemented an unsupervised machine learning approach using K-Means clustering combined with spatial logic. This method robustly identifies the Superficial Zone (SZ), Middle Zone (MZ), and Deep Zone (DZ) based on their intrinsic color and intensity signatures.

### 2.1. Feature Extraction and Normalization
For every pixel in the ROI, the Hue (0-180) and Intensity (0-255) values are extracted and normalized to a 0-1 range. Pixels with low intensity ($V < 10$) are filtered out as background noise.

### 2.2. K-Means Clustering
A K-Means clustering algorithm ($k=3$) is applied to the normalized (Hue, Intensity) feature space. This classifies pixels into three distinct clusters based on their spectral properties:
1.  **Dark Extinction Cluster (MZ):** Identified as the cluster with the lowest centroid intensity ($V$), corresponding to the "extinction" phenomenon observed in the Middle Zone where fibers are oriented perpendicular to the sectioning plane (approx. 45° to the polarization axis in specific setups).
2.  **Superficial Zone Cluster (SZ):** Identified from the remaining two clusters as the one with the lower mean Hue (typically Orange/Red spectrum).
3.  **Deep Zone Cluster (DZ):** Identified as the remaining cluster with the higher mean Hue (typically Green spectrum).

### 2.3. Spatial Row Voting
To enforce spatial continuity, a row-wise voting mechanism is employed. For each pixel row $y$ in the image, the median properties (Hue, Intensity) are calculated. The row is then assigned to the zone (SZ, MZ, or DZ) whose cluster centroid is closest in Euclidean distance to the row's median properties. This generates a depth-dependent zone profile.

### 2.4. Boundary Definition
The transitions between zones are detected by scanning the simplified zone profile. The SZ/MZ boundary is defined as the depth where the classification consistently shifts from the SZ cluster to the MZ cluster, and the MZ/DZ boundary is defined similarly.

## 3. Quantitative Fiber Orientation Analysis
The fiber orientation angle ($\theta$) is derived quantitatively from the observed interference colors.

### 3.1. Color-to-Angle Mapping Calibration
The system dynamically calibrates the mapping function $F(H) \rightarrow \theta$ for each image (or batch of images) based on the detected zones:
-   **Zero-Degree Anchor ($H_{SZ}$):** The median hue of the detected Superficial Zone is defined as corresponding to fibers parallel to the surface (0°).
-   **Ninety-Degree Anchor ($H_{DZ}$):** The median hue of the detected Deep Zone is defined as corresponding to fibers perpendicular to the surface (90°).

### 3.2. Pixel-wise Angle Calculation
For every valid pixel $(x, y)$, the fiber orientation angle $\theta(x, y)$ is calculated using a linear interpolation mapping function:
$$ \theta(x, y) = \frac{H(x, y) - H_{SZ}}{H_{DZ} - H_{SZ}} \times 90^\circ $$
Values are clamped to the $[0^\circ, 90^\circ]$ range. This method accounts for sample-specific color shifts (e.g., "Red-shifted" vs. "Green-shifted" samples) by using internal standards ($H_{SZ}, H_{DZ}$) rather than hardcoded threshold values.

## 4. Depth Profiling and Statistical Aggregation
The morphological variation of fiber orientation with depth is quantified by generating a normalized depth profile.

1.  **Normalization:** The cartilage thickness is normalized from 0.0 (Articular Surface) to 1.0 (Tidemark/Bone Interface).
2.  **Binning:** The depth is discretized into 100 equally spaced bins (1% thickness increments).
3.  **Aggregation:** For each depth bin, the orientation angles of all constituent pixels are aggregated. The circular mean orientation and standard deviation are calculated to account for the angular periodicity.
4.  **Gap Filling:** To handle artifacts or voids (fissures, lacunae), a linear interpolation algorithm fills discontinuous data points in the depth profile, ensuring a continuous function for derivation of biomechanical gradients.

## 5. Batch Processing and Data Normalization
For multi-sample comparison, a Reference-Based Batch Analysis protocol is used. A representative "Reference Image" is first analyzed to establish the canonical $H_{SZ}$ and $H_{DZ}$ calibration values. These calibration parameters are then globally applied to all subsequent samples in the batch. This ensures that quantitative comparisons (e.g., mean angular deviation, zonal thickness changes) reflect true structural differences rather than inter-sample staining or lighting inconsistencies.
