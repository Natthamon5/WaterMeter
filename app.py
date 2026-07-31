from flask import Flask, render_template, request, jsonify, session
import json, prediction

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