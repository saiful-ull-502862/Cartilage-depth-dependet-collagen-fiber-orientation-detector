import os
import io
import pandas as pd
import numpy as np
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

def parse_excel(file_storage):
    """
    Parses the uploaded Excel file and extracts plotting data.
    Returns a dict with 'type' (reference/batch) and 'data'.
    """
    try:
        # Read the Excel file
        xls = pd.ExcelFile(file_storage)
        sheet_names = xls.sheet_names
        
        data = {}
        file_type = "unknown"
        
        # Check for Reference Analysis format
        # Usually has "Depth Profile" or "Reference Profile"
        if "Depth Profile" in sheet_names and "Combined Depth Profile" not in sheet_names:
            file_type = "reference"
            df = pd.read_excel(xls, "Depth Profile")
            
            # Expected cols: Normalized Thickness, Mean Angle (Degrees), Std Dev
            # Map them standard keys
            # Clean column names
            df.columns = [c.strip() for c in df.columns]
            
            # Find relevant columns
            thick_col = next((c for c in df.columns if "Thickness" in c), None)
            angle_col = next((c for c in df.columns if "Angle" in c), None)
            std_col = next((c for c in df.columns if "Std" in c or "Dev" in c), None)
            
            if thick_col and angle_col:
                data = {
                    "thickness": df[thick_col].tolist(),
                    "angle": df[angle_col].tolist(),
                    "std": df[std_col].tolist() if std_col else [0]*len(df),
                    "filename": file_storage.filename
                }

        # Check for Batch Analysis format
        elif "Combined Depth Profile" in sheet_names:
            file_type = "batch"
            df = pd.read_excel(xls, "Combined Depth Profile")
            df.columns = [c.strip() for c in df.columns]
            
            # This sheet usually has: Normalized Thickness, Image 1, Image 2..., Mean, Std Dev
            thick_col = next((c for c in df.columns if "Thickness" in c), None)
            mean_col = "Mean"
            std_col = "Std Dev"
            
            if thick_col:
                # Extract individual traces if needed, but primarily we want Mean +/- Std
                # actually user wants "each group (mean and std with shaded area)"
                # "Group" in this context might just mean the whole batch is one group.
                
                # Check for Mean/Std columns
                if mean_col not in df.columns or std_col not in df.columns:
                     # Attempt to calculate if missing (though they should be there)
                     pass 
                
                data = {
                    "thickness": df[thick_col].tolist(),
                    "mean_angle": df[mean_col].tolist() if mean_col in df.columns else [],
                    "std_angle": df[std_col].tolist() if std_col in df.columns else [],
                    "filename": file_storage.filename
                }
                
        else:
            return {"error": "Unknown Excel format. Could not find 'Depth Profile' or 'Combined Depth Profile' sheets."}
            
        return {"type": file_type, "data": data}

    except Exception as e:
        return {"error": str(e)}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    if 'files[]' not in request.files:
        return jsonify({"error": "No files provided"}), 400
    
    files = request.files.getlist('files[]')
    results = []
    
    for file in files:
        if file.filename == '': continue
        
        # Parse
        res = parse_excel(file)
        if "error" in res:
            results.append({"filename": file.filename, "success": False, "error": res["error"]})
        else:
            results.append({"filename": file.filename, "success": True, "type": res["type"], "data": res["data"]})
            
    return jsonify({"results": results})

if __name__ == '__main__':
    app.run(debug=True, port=5001)
