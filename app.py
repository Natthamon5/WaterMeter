# from flak import Flask,render_template

# app = Flask(__name__)

# @app.route("/")
# def index():
#     return render_template('index.html')

# @app.route('/upload')
# def upload_page():
#     return render_template('upload.html')

# @app.route('/result')
# def result_page():
#     return render_template('result.html')

# @app.route('/test')
# def test_page():
#     return render_template('test.html')



# if __name__ == '__main__':
#     app.run(debug=True)

from flask import Flask, render_template, request, jsonify, session
import os, json, prediction

app = Flask(__name__)
app.secret_key = "supersecret"  # required for sessions

@app.route("/")
def index():
    return render_template('upload.html')

@app.route("/detection", methods=["POST"])
def detection():
    try:
        image = request.files["file"]
        
        predictedFile = prediction.full_predict(image)
        return jsonify(predictedFile)
    except Exception as e:
        return jsonify({"detection error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)