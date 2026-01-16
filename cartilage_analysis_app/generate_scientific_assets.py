
import matplotlib.pyplot as plt
import numpy as np
import matplotlib.patches as patches
import matplotlib.colors as mcolors

def create_scientific_assets():
    # Style settings
    plt.rcParams['font.family'] = 'sans-serif'
    plt.rcParams['font.sans-serif'] = ['Arial']
    plt.rcParams['figure.dpi'] = 300
    
    # ==========================================
    # 1. RGB vs HSV 2D Schematic (Color Wheel)
    # ==========================================
    fig1 = plt.figure(figsize=(10, 5))
    
    # Subplot 1: RGB (Additive Mixing)
    ax1 = fig1.add_subplot(121)
    ax1.set_aspect('equal')
    ax1.set_title('RGB Additive Model (Input)', fontsize=14, pad=20)
    ax1.axis('off')
    
    # Draw RGB Circles
    circle_r = patches.Circle((0.35, 0.6), 0.3, color='red', alpha=0.6, label='Red')
    circle_g = patches.Circle((0.65, 0.6), 0.3, color='green', alpha=0.6, label='Green')
    circle_b = patches.Circle((0.5, 0.35), 0.3, color='blue', alpha=0.6, label='Blue')
    ax1.add_patch(circle_r)
    ax1.add_patch(circle_g)
    ax1.add_patch(circle_b)
    ax1.text(0.5, 0.5, 'Components\ncombined', ha='center', va='center', fontsize=9)
    
    # Arrow
    fig1.text(0.5, 0.5, 'Mathematical\nTransformation', ha='center', va='center', fontsize=12, fontweight='bold')
    
    # Subplot 2: HSV (Polar/Wheel)
    ax2 = fig1.add_subplot(122, projection='polar')
    ax2.set_title('HSV Color Space (Output)', fontsize=14, pad=20)
    
    # Create color wheel
    N = 180
    theta = np.linspace(0.0, 2 * np.pi, N, endpoint=False)
    radii = np.ones(N)
    width = (2 * np.pi) / N
    colors = plt.cm.hsv(theta / (2 * np.pi))
    
    ax2.bar(theta, radii, width=width, bottom=0.0, color=colors, alpha=0.8)
    ax2.set_yticks([])
    ax2.set_xticks(np.linspace(0, 2*np.pi, 4, endpoint=False))
    ax2.set_xticklabels(['0° (Red)', '90° (Green)', '180° (Cyan)', '270° (Purple)'])
    
    # Annotate Hue
    ax2.annotate('Hue (Angle)\n= Fiber Orientation', xy=(0, 0), xytext=(0.5, 1.2),
                 textcoords='axes fraction', ha='center', fontsize=10, 
                 arrowprops=dict(arrowstyle='->', connectionstyle='arc3,rad=.2'))

    plt.tight_layout()
    plt.savefig('1_RGB_to_HSV_2D.jpg', bbox_inches='tight')
    plt.close()

    # ==========================================
    # 2. Pixel Mask Visualization (Grid)
    # ==========================================
    fig2, (ax_raw, ax_mask) = plt.subplots(1, 2, figsize=(10, 5))
    
    # Create Mock Pixel Grid (10x10)
    np.random.seed(42)
    grid_h = np.random.randint(0, 180, (10, 10)) # Hue
    grid_s = np.random.randint(50, 255, (10, 10)) # Sat
    grid_v = np.random.normal(100, 50, (10, 10)) # Value
    
    # Introduce "Dark" noise pixels (V < 10)
    noise_indices = np.random.choice([True, False], (10, 10), p=[0.3, 0.7])
    grid_v[noise_indices] = np.random.randint(0, 9, np.sum(noise_indices))
    
    # Convert to RGB for display
    # H(0-179)->(0-1), S(0-255)->(0-1), V -> (0-1)
    hsv_grid = np.dstack((grid_h/180.0, grid_s/255.0, np.clip(grid_v/255.0, 0, 1)))
    rgb_grid = mcolors.hsv_to_rgb(hsv_grid)
    
    # Plot Raw
    ax_raw.imshow(rgb_grid)
    ax_raw.set_title('Raw Image Pixels', fontsize=12)
    ax_raw.set_xticks([]); ax_raw.set_yticks([])
    
    # Create Mask: Valid if V > 10
    mask = grid_v > 10
    
    # Apply Mask (make invalid black)
    rgb_masked = rgb_grid.copy()
    rgb_masked[~mask] = [0, 0, 0] # Set to Black
    
    # Plot Masked
    ax_mask.imshow(rgb_masked)
    ax_mask.set_title('After Threshold Filtering (V > 10)', fontsize=12)
    ax_mask.set_xticks([]); ax_mask.set_yticks([])
    
    # Highlight a rejected pixel
    bad_y, bad_x = np.argwhere(~mask)[0]
    rect = patches.Rectangle((bad_x-0.5, bad_y-0.5), 1, 1, linewidth=2, edgecolor='red', facecolor='none')
    ax_mask.add_patch(rect)
    ax_mask.text(bad_x, bad_y, 'Rejected', color='white', fontsize=8, ha='center', va='center')
    
    plt.tight_layout()
    plt.savefig('2_Pixel_Masking_Process.jpg', bbox_inches='tight')
    plt.close()

    # ==========================================
    # 3. Hue Histogram
    # ==========================================
    fig3, ax3 = plt.subplots(figsize=(6, 4))
    
    # Generate Bimodal Data
    data_sz = np.random.normal(5, 5, 1000) # Peak at 5 (Red)
    data_dz = np.random.normal(65, 8, 1000) # Peak at 65 (Green)
    data_combined = np.concatenate([data_sz, data_dz])
    data_combined = np.clip(data_combined, 0, 179)
    
    n, bins, patches_hist = ax3.hist(data_combined, bins=90, range=(0, 180), color='gray', alpha=0.7, edgecolor='black', linewidth=0.5)
    
    # Color bars by hue
    for i, p in enumerate(patches_hist):
        hue_val = (p.get_x() + p.get_width()/2) / 180.0
        p.set_facecolor(plt.cm.hsv(hue_val))
        
    ax3.set_title('Hue Histogram Analysis', fontsize=12)
    ax3.set_xlabel('Hue Channel Value (0-179)', fontsize=10)
    ax3.set_ylabel('Pixel Count', fontsize=10)
    
    # Annotate Peaks
    ax3.annotate('SZ Anchor ($H_0$)\n(Surface Zone)', xy=(5, np.max(n)), xytext=(20, np.max(n)+10),
                 arrowprops=dict(facecolor='black', shrink=0.05))
    ax3.annotate('DZ Anchor ($H_{90}$)\n(Deep Zone)', xy=(65, np.max(n)*0.8), xytext=(80, np.max(n)*0.8),
                 arrowprops=dict(facecolor='black', shrink=0.05))
                 
    plt.tight_layout()
    plt.savefig('3_Hue_Histogram.jpg', bbox_inches='tight')
    plt.close()

    # ==========================================
    # 4. HSV Cone Slice (Preprocessing Chart)
    # ==========================================
    fig4 = plt.figure(figsize=(6, 5))
    ax4 = fig4.add_subplot(111)
    
    # Draw Triangle (Slice of Cone)
    # Origin (0,0) is Black
    # Top Left (0, 1) is White
    # Top Right (1, 1) is Color
    
    triangle = patches.Polygon([[0, 0], [0, 1], [1, 1]], closed=True, color='lightgray', alpha=0.3)
    ax4.add_patch(triangle)
    
    # Axes
    ax4.arrow(0, 0, 0, 1.1, head_width=0.05, head_length=0.05, fc='k', ec='k')
    ax4.text(-0.1, 0.5, 'Value (V)\n(Intensity)', rotation=90, va='center', ha='center', fontsize=12)
    
    ax4.arrow(0, 1, 1.1, 0, head_width=0.05, head_length=0.05, fc='k', ec='k')
    ax4.text(0.5, 1.05, 'Saturation (S)\n(Purity)', va='bottom', ha='center', fontsize=12)
    
    # Color Gradients
    # show gradient from White (0,1) to Color (1,1)
    grad = np.linspace(0, 1, 100).reshape(1, -1)
    # Saturation gradient
    ax4.imshow(grad, extent=(0, 1, 0.9, 1.0), aspect='auto', cmap='Reds', alpha=0.8) # Example Red Hue
    ax4.text(0.5, 0.95, 'White -> Red', ha='center', va='center', color='white', fontsize=8, fontweight='bold')
    
    # Value gradient vertical is harder to mock with imshow in triangle shape easily, just annotate
    ax4.text(0.05, 0.1, 'Black (V=0)', fontsize=10)
    ax4.text(0.05, 0.9, 'White (V=1, S=0)', fontsize=10)
    ax4.text(0.9, 0.9, 'Pure Color (V=1, S=1)', fontsize=10, ha='right')
    
    # Threshold Line
    ax4.axhline(y=0.1, color='red', linestyle='--', linewidth=2)
    ax4.text(0.5, 0.05, 'Noise Threshold (V < 0.1)', color='red', ha='center')
    
    # Hue as rotation
    ax4.annotate('Hue (H) is the \nRotation Angle \naround V-axis', xy=(0, 0), xytext=(0.5, 0.4),
                 arrowprops=dict(arrowstyle='->', connectionstyle='arc3,rad=.2'))

    ax4.set_xlim(-0.2, 1.2)
    ax4.set_ylim(-0.1, 1.2)
    ax4.axis('off')
    ax4.set_title('HSV Color Model: Vertical Slice', fontsize=14)
    
    plt.tight_layout()
    plt.savefig('4_HSV_Cone_Slice.jpg', bbox_inches='tight')
    plt.close()

if __name__ == "__main__":
    create_scientific_assets()
