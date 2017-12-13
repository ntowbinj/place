from flask import Flask, render_template, jsonify

app = Flask(__name__)


@app.route("/")
def hello():
    return render_template('template.html')

@app.route("/lessons")
def lessons():
    return jsonify(dict(hello=5))




