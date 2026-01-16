# Cartilage Depth-Dependent Collagen Fiber Orientation Detector

A web-based application for analyzing collagen fiber orientation in cartilage histology images using Polarized Light Microscopy (PLM) color patterns.

![Analysis Interface](https://img.shields.io/badge/Python-3.8+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-Web_App-green.svg)
![OpenCV](https://img.shields.io/badge/OpenCV-Image_Processing-red.svg)

## Overview

This tool analyzes PLM images of cartilage to determine collagen fiber orientation angles across different zones:
- **Superficial Zone (SZ)**: Fibers parallel to the surface (~0°)
- **Middle Zone (MZ)**: Transitional oblique fibers (~30-60°)
- **Deep Zone (DZ)**: Fibers perpendicular to the surface (~90°)

## Features

- 📷 **Image Upload & Cropping**: Upload and crop your PLM images to select the region of interest
- 📏 **Zone Definition**: Interactively define SZ, MZ, and DZ boundaries using draggable lines
- 🎨 **Color-to-Angle Mapping**: Converts HSV hue values to fiber orientation angles
  - Red (Hue 0) → 0° (horizontal)
  - Green (Hue 60) → 90° (vertical)
- 📊 **Depth Profile Chart**: Visualize fiber angle variation across tissue depth
- 📈 **Zone Analysis**: Detailed color properties and angle calculations for each zone
- 📥 **Excel Export**: Download depth profile data with color information
- 🔄 **Resizable Charts**: Adjust chart dimensions for better visualization

## Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/saiful-ull-502862/Cartilage-depth-dependet-collagen-fiber-orientation-detector.git
   cd Cartilage-depth-dependet-collagen-fiber-orientation-detector
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python app.py
   ```

4. **Open in browser**
   Navigate to `http://127.0.0.1:5000` in your web browser.

## Usage

1. **Upload Image**: Drag & drop or click to upload your PLM histology image
2. **Crop ROI**: Crop the region of interest (ensure the superficial zone is at the top)
3. **Define Zones**: Adjust the zone boundaries (SZ%, MZ%, DZ%) using the draggable lines or input fields
4. **Run Analysis**: Click "Run Analysis" to process the image
5. **View Results**:
   - Annotated image with zone labels
   - Depth profile chart showing angle vs. thickness
   - Color properties for each zone
6. **Export Data**: Download the Excel file with complete depth profile data

## Color-to-Angle Mapping

The application uses the HSV color space to map colors to fiber orientation angles:

| Color | OpenCV Hue | Fiber Angle |
|-------|------------|-------------|
| Red | 0 | 0° |
| Orange | 15 | 22.5° |
| Yellow | 30 | 45° |
| Yellow-Green | 45 | 67.5° |
| Green | 60 | 90° |

**Formula**: `Angle = Hue × 1.5`

## Project Structure

```
cartilage_analysis_app/
├── app.py                 # Flask application & image processing logic
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── static/
│   ├── css/
│   │   └── style.css     # Application styles
│   ├── js/
│   │   └── script.js     # Frontend JavaScript
│   └── uploads/          # Temporary image storage
└── templates/
    └── index.html        # Main HTML template
```

## Technologies Used

- **Backend**: Python, Flask, NumPy, OpenCV, openpyxl
- **Frontend**: HTML5, CSS3, JavaScript, Chart.js, Cropper.js
- **Image Processing**: HSV color space analysis

## Excel Export

The exported Excel file contains two sheets:
1. **Depth Profile**: Normalized thickness, mean angle, std dev, zone, hue, RGB, hex color, intensity
2. **Color Mapping Info**: Explanation of the color-to-angle conversion formula

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- OpenCV for image processing capabilities
- Chart.js for data visualization
- Cropper.js for image cropping functionality
