
import matplotlib.pyplot as plt
import numpy as np

def create_scientific_figures():
    # Set style
    plt.style.use('default')
    
    # --- Figure 1: The Transformation Function (Hue to Angle) ---
    fig1, ax1 = plt.subplots(figsize=(6, 4))
    
    # Mock data
    # H0 (SZ) = 10 (Red), H90 (DZ) = 70 (Green)
    h0 = 10
    h90 = 70
    
    hues = np.linspace(0, 100, 200)
    
    # Function: theta = (h - h0)/(h90 - h0) * 90
    angles = (hues - h0) / (h90 - h0) * 90
    angles = np.clip(angles, 0, 90)
    
    # Plot
    ax1.plot(hues, angles, color='blue', linewidth=2, label='Transfer Function')
    
    # Annotations
    ax1.scatter([h0], [0], color='red', s=100, zorder=5, label='SZ Anchor ($H_0$)')
    ax1.scatter([h90], [90], color='green', s=100, zorder=5, label='DZ Anchor ($H_{90}$)')
    
    ax1.axvline(h0, color='red', linestyle='--', alpha=0.5)
    ax1.axvline(h90, color='green', linestyle='--', alpha=0.5)
    
    ax1.set_xlabel('Measured Hue (OpenCV 0-179)', fontsize=12)
    ax1.set_ylabel('Calculated Fiber Angle ($\theta$)', fontsize=12)
    ax1.set_title('Scientific Color-to-Angle Mapping', fontsize=14)
    ax1.grid(True, linestyle=':', alpha=0.6)
    ax1.legend()
    
    # Region shading
    ax1.fill_between(hues, 0, 90, where=(hues>=h0)&(hues<=h90), color='gray', alpha=0.1)
    ax1.text((h0+h90)/2, 45, 'Linear Interpolation\nRegion', ha='center', va='center')
    
    plt.tight_layout()
    plt.savefig('scientific_transfer_function.png', dpi=300)
    print("Created scientific_transfer_function.png")
    
    # --- Figure 2: Anchor Calculation (Histogram) ---
    fig2, ax2 = plt.subplots(figsize=(6, 4))
    
    # Generate mock distributions
    sz_hues = np.random.normal(10, 5, 1000)
    dz_hues = np.random.normal(70, 8, 1000)
    
    counts, bins, patches = ax2.hist([sz_hues, dz_hues], bins=50, range=(0, 100), 
                                     color=['red', 'green'], alpha=0.6, 
                                     label=['SZ Distribution', 'DZ Distribution'], stacked=False)
    
    # Median Lines
    ax2.axvline(10, color='red', linewidth=2, linestyle='-', label='Median $H_0$')
    ax2.axvline(70, color='green', linewidth=2, linestyle='-', label='Median $H_{90}$')
    
    ax2.annotate('Reference $H_0$', xy=(10, 40), xytext=(20, 60),
                 arrowprops=dict(facecolor='black', shrink=0.05))
                 
    ax2.annotate('Reference $H_{90}$', xy=(70, 40), xytext=(50, 60),
                 arrowprops=dict(facecolor='black', shrink=0.05))

    ax2.set_xlabel('Hue Channel Value', fontsize=12)
    ax2.set_ylabel('Pixel Frequency', fontsize=12)
    ax2.set_title('Automatic Reference Anchor Extraction', fontsize=14)
    ax2.legend()
    
    plt.tight_layout()
    plt.savefig('scientific_anchor_histogram.png', dpi=300)
    print("Created scientific_anchor_histogram.png")

if __name__ == "__main__":
    create_scientific_figures()
