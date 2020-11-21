"""
add_face_dataset.py
Simple front-end server and add face for better training
"""

import zmq
import logging
from common.network import *
from common import zmq_serdes
from common.protocol.msg import *
from common.protocol.constant import DEEP_INPUT_SHAPE
import threading
import numpy as np
import random
import cv2
import os

# The thread to receive result from socket


class ResultReceiver(threading.Thread):
    def __init__(self, socket):
        threading.Thread.__init__(self)
        self.socket = socket

    def run(self):
        logging.info('Begin receive result to backend')
        while True:
            result = zmq_serdes.recv_zipped_pickle(self.socket)
            logging.info('[req_id={}] Received a result from backend.\n\tres_state={}\n\tuser_id={}'.format(
                result.req_id, result.res_state, result.user_id))


def translate(image, x, y):
    M = np.float32([[1, 0, x], [0, 1, y]])
    shifted = cv2.warpAffine(image, M, (image.shape[1], image.shape[0]))
    return shifted


def addPaceImge(DIR):
    file_list = os.listdir(DIR)
    lengthOfFile = len(file_list)
    imges = []
    if(len(file_list)) < 10:
        for i in range(10 - lengthOfFile):
            img = cv2.imread(DIR+"/"+file_list[i % lengthOfFile])
            if i < 2:
                img = translate(img, 0, 10)
            elif i < 5:
                img = translate(img, 5, -5)
            else:
                img = translate(img, 10, 0)

            img = cv2.resize(img, DEEP_INPUT_SHAPE()[1:3])
            img = np.expand_dims(img, axis=0)
            imges.append(img)
            # cv2.imwrite("./"+DIR+"/add"+str(i)+'.jpg',img)
    for i in range(lengthOfFile):
            img = cv2.imread(DIR+"/"+file_list[i])
            img = cv2.resize(img, DEEP_INPUT_SHAPE()[1:3])
            img = np.expand_dims(img, axis=0)
            imges.append(img)
    return imges


def interactive_get_image(img_file_path):
    img = ()
    label = ()
    while True:
        try:
            img = addPaceImge(img_file_path)
            label = img_file_path.split('/')[1]
            break
        except:
            logging.info('Image {} does not exist'.format(img_file_path))
    return (img, label)


def main():
    LOG_FORMAT = '%(asctime)s [front-end-server]: [%(levelname)s] %(message)s'
    logging.basicConfig(level=logging.DEBUG, format=LOG_FORMAT)

    context = zmq.Context()
    # Socket to send work to backend
    work_sender = context.socket(zmq.PUSH)
    work_sender.bind(get_zmq_uri(FRONT_IP(), FRONT_ISSUE_PORT()))

    # Socket to receive result from backend
    result_recv = context.socket(zmq.PULL)
    result_recv.bind(get_zmq_uri(FRONT_IP(), FRONT_RECV_PORT()))

    logging.info('Begin send works to backend')

    # Start result receiver thread
    result_recv_thread = ResultReceiver(result_recv)
    result_recv_thread.start()

    req_id = 0
    while True:

        # Get the operation from interactive stdin
        cmd = input("Please input operation [a]dd/[r]ecognize: ")
        if cmd != "a" and cmd != "r":
            continue

        new_work = ()
        if cmd == "a":
            # Training new face
            for path in os.listdir('test_images/lfw_face_dataset'):
                img, label = interactive_get_image('test_images/lfw_face_dataset/'+path)
                for i in range(10):
                    new_work = PictureMsg(req_id, ReqType.NEW, img[i], label)
                    zmq_serdes.send_zipped_pickle(work_sender, new_work)
                    logging.info('Send works with req_id={}, label={} to backend'.format(
            req_id, new_work.label))
            
        else:
            # Recognize the face
            new_work = PictureMsg(req_id, ReqType.RECOG, img, "")
            zmq_serdes.send_zipped_pickle(work_sender, new_work)
            logging.info('Send works with req_id={}, label={} to backend'.format(
            req_id, new_work.label))


        

        # Monotonic increase the request id
        req_id += 1

    # Wait the result receiver thread to be done
    result_recv_thread.join()


if __name__ == "__main__":
    main()
