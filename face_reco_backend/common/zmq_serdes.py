# Origin: https://pyzmq.readthedocs.io/en/latest/serialization.html
import pickle
import zlib
import json

def send_zipped_pickle(socket, obj, flags=0, protocol=-1):
    """pickle an object, and zip the pickle before sending it"""
    p = pickle.dumps(obj, protocol)
    z = zlib.compress(p)
    return socket.send(z, flags=flags)

def recv_zipped_pickle(socket, flags=0, protocol=-1):
    """inverse of send_zipped_pickle"""
    z = socket.recv(flags)
    p = zlib.decompress(z)
    return pickle.loads(p)

def send_json(socket, obj, flags=0, protocol=-1):
    """Send a dictionary to socket in JSON format"""
    s = json.dumps(obj)
    return socket.send_string(s, flags=flags)

def recv_json(socket, flags=0, protocol=-1):
    """Receive a dictionary from socket in JSON format"""
    s = socket.recv(flags)
    return json.loads(s)