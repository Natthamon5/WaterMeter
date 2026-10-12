from ultralytics import YOLO
import cv2
import math
import numpy as np
from collections import defaultdict
import os, base64

model = YOLO('./yolov11s_meter_best2.pt')

current_dir = os.path.dirname(os.path.abspath(__file__))
model2_path = os.path.join(current_dir, 'yolov11s_num_best2.pt')

model2 = YOLO(model2_path)


def predict_img(img):
    results = model(img)

    # Initialize default values
    data = {
        'result': results[0],
        'meter_corners': [],
        'meter_bbox': [0, 0, 0, 0],
        'left_marker': None,
        'right_marker': []
    }
    names = data['result'].names

    for box in data['result'].boxes:

        cls_id = int(box.cls[0])
        label = names[cls_id]
        
        coords = box.xyxy[0].tolist()
        x1, y1, x2, y2 = coords
        # find average of x and y, store in avgx, avgy
        avgx = (x1+x2)/2
        avgy = (y1+y2)/2

        if label == 'meter':
            data['meter_corners'] = [
                (x1,y1, 'top-left'),
                (x2,y1, 'top-right'),
                (x1,y2, 'bottom-left'),
                (x2,y2, 'bottom-right')
            ]
            data['meter_bbox'] = [int(n) for n in coords]
        elif label == 'left':
            data['left_marker'] = [
                (avgx, avgy),
                tuple(coords) # () tuple is immutable, [] list is mutable
            ]
        elif label == 'right':
            data['right_marker'] = [
                (avgx, avgy),
                (x1,y1,x2,y2)
            ]
    return data

def group_digits_into_columns(digits, tolerance_ratio=3):
    """จัดกลุ่มตัวเลขที่อยู่ในหลักเดียวกัน (X ใกล้กัน)"""
    if not digits:
        return {}
    avg_height  = np.mean([d['height'] for d in digits])
    x_tolerance = avg_height / tolerance_ratio

    columns = defaultdict(list)
    col_idx = 0
    columns[col_idx].append(digits[0])

    for digit in digits[1:]:
        if (digit['x'] - columns[col_idx][-1]['x']) > x_tolerance:
            col_idx += 1
        columns[col_idx].append(digit)

    return columns
def pick_best_per_column(columns):
    """คืนค่า (ตัวเลขที่เลือก, ตัวเลขที่ตัดทิ้งเพราะซ้อนกัน)"""
    selected = []
    rejected_overlap = []

    for col_idx in sorted(columns.keys()):
        column = sorted(columns[col_idx], key=lambda d: d['conf'], reverse=True)
        selected.append(column[0])           # เลือก Confidence สูงสุด
        rejected_overlap.extend(column[1:])  # ที่เหลือถือว่าซ้อนกัน

    return selected, rejected_overlap

def resizeImage(img, ext=".jpg"):
    h, w = img.shape[:2]
    target_width = 200
    target_height = int((h / w) * target_width)

    # Compute scaling factor
    scale = min(target_width / w, target_height / h)
    new_w, new_h = int(w * scale), int(h * scale)

    # Resize while preserving aspect ratio
    resizedImage = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

    """
    Convert a cv2 image (NumPy array) into a base64 data URL string.
    """
    # Encode image to memory buffer
    success, buffer = cv2.imencode(ext, img)
    if not success:
        raise ValueError("Could not encode image")

    # Convert to base64 string
    b64_str = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/{ext.strip('.').lower()};base64,{b64_str}"



def full_predict(fileStorage):

    # Convert FileStorage to cv2 image
    file_bytes = np.frombuffer(fileStorage.read(), np.uint8)
    image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    
    image_data = predict_img(image)

    annotated_img = image_data['result'].plot()

    #find nearest meter keypoint of left, right classes
    nearL_index = None
    nearR_index = None
    min_Ldist = float('inf')
    min_Rdist = float('inf')
    for i, (x, y, txt) in enumerate(image_data['meter_corners']):
        lx, ly = image_data['left_marker'][0]
        # Euclidean Distance Method
        left_Ldist = math.sqrt((x - lx)**2 + (y - ly)**2)
        if left_Ldist < min_Ldist:
            min_Ldist = left_Ldist
            nearL_index = i

        rx, ry = image_data['right_marker'][0]
        # Euclidean Distance Method
        right_Rdist = math.sqrt((x - rx)**2 + (y - ry)**2)
        if right_Rdist < min_Rdist:
            min_Rdist = right_Rdist
            nearR_index = i

    #compare keypoint heights and rotate original image
    rotated_img = None
    if(image_data['left_marker'][0][1] > image_data['meter_corners'][nearL_index][1] 
    and image_data['right_marker'][0][1] < image_data['meter_corners'][nearR_index][1]):
        rotated_img = cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)
    elif(image_data['left_marker'][0][1] < image_data['meter_corners'][nearL_index][1] 
    and image_data['right_marker'][0][1] > image_data['meter_corners'][nearR_index][1]):
        rotated_img = cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
    elif(image_data['left_marker'][0][1] < image_data['meter_corners'][nearL_index][1] 
    and image_data['right_marker'][0][1] < image_data['meter_corners'][nearR_index][1]):
        rotated_img = cv2.rotate(image, cv2.ROTATE_180)

    if rotated_img is not None:
        #re-predict rotated image
        rotated_img_data = predict_img(rotated_img)
        re_predict_rotated_img = rotated_img_data['result'].plot()

        img_to_tilt = rotated_img
        img_to_tilt_data = rotated_img_data
    else:
        img_to_tilt = image
        img_to_tilt_data = image_data

    # detect tilt within +90/-90 degrees
    # calculate the angle of the line between average markers
    lx1, ly1, lx2, ly2 = img_to_tilt_data['left_marker'][1]
    rx1, ry1, rx2, ry2 = img_to_tilt_data['right_marker'][1]
    avglx, avgly = img_to_tilt_data['left_marker'][0]
    avgrx, avgry = img_to_tilt_data['right_marker'][0]
    angle_rad = math.atan2(avgry - avgly, avgrx - avglx)
    angle_deg = math.degrees(angle_rad)

    h, w = img_to_tilt.shape[:2]
    center = (w // 2, h // 2)

    # Create the rotation matrix
    # cv2.getRotationMatrix2D(center, angle, scale)
    M = cv2.getRotationMatrix2D(center, angle_deg, 1.0)

    # Warp the image to fix the tilt
    tilted_img = cv2.warpAffine(img_to_tilt, M, (w, h), flags=cv2.INTER_CUBIC)

    tilted_img_data = predict_img(tilted_img)
    re_predict_tilted_img = tilted_img_data['result'].plot()

    #crop image
    img_to_crop = tilted_img
    cropped_img = img_to_crop[tilted_img_data['meter_bbox'][1]:tilted_img_data['meter_bbox'][3], 
                            tilted_img_data['meter_bbox'][0]:tilted_img_data['meter_bbox'][2]]

    results = model2(cropped_img)
    result = results[0]
    detect_num = result.plot()

    num_detections = []
    for box in result.boxes:
        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
        num_detections.append({
            'digit'  : int(box.cls[0]),
            'conf'   : float(box.conf[0]),
            'x'      : (x1 + x2) / 2,   # ศูนย์กลาง X
            'y'      : (y1 + y2) / 2,   # ศูนย์กลาง Y
            'height' : y2 - y1
        })

    if not num_detections:
        print("ไม่พบตัวเลขในภาพ")
        raise SystemExit

    avg_y = np.mean([d['y'] for d in num_detections])

    meter_raw  = sorted([d for d in num_detections if d['y'] <  avg_y], key=lambda d: d['x'])
    room_digits_raw = sorted([d for d in num_detections if d['y'] >= avg_y], key=lambda d: d['x'])

    MAX_METER_DIGITS = 4
    MAX_ROOM_DIGITS  = 3 

    columns             = group_digits_into_columns(meter_raw)
    selected, rejected_overlap = pick_best_per_column(columns)
    room_columns = group_digits_into_columns(room_digits_raw)
    room_selected, rejected_overlap_room = pick_best_per_column(room_columns)

    meter_digits   = selected[:MAX_METER_DIGITS]   
    room_digits  = room_selected[:MAX_ROOM_DIGITS]

    meter_reading  = "".join(str(d['digit']) for d in meter_digits)
    room_number = "".join(str(d['digit']) for d in room_digits)

    meter_confidences = [f"{d['conf']:.2f}" for d in meter_digits]
    final_conf_str = ", ".join(meter_confidences)
    
    predictedData = {
        'predicted_img': resizeImage(cropped_img),
        'digit': meter_reading,
        'room': room_number,
        'confidence': final_conf_str
    }
    return predictedData
