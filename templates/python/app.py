from flask import Flask, jsonify
import os

app = Flask(__name__)

PORT = int(os.environ.get('PORT', {{SERVICE_PORT}}))
SERVICE_NAME = os.environ.get('SERVICE_NAME', '{{SERVICE_NAME}}')


@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'service': SERVICE_NAME})


@app.route('/')
def index():
    return jsonify({'message': f'Welcome to {SERVICE_NAME}'})


if __name__ == '__main__':
    print(f'{SERVICE_NAME} listening on port {PORT}')
    app.run(host='0.0.0.0', port=PORT, debug=False)
