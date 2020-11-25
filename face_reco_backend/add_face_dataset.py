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

# Shared counter between sender and receiver
issued_label = {}
mutex = threading.Lock()

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

class WorkSender(threading.Thread):
    def __init__(self, socket):
        threading.Thread.__init__(self)
        self.socket = socket

    def run(self):
        logging.info('Begin send work to backend')
        req_id = 0
        new_work = ()
        base_dir = 'test_images/lfw_face_dataset'
        # Training new face
        for sub_dir in os.listdir(base_dir):
            label = sub_dir
            imgs = self.get_images(base_dir, sub_dir)
            print(label)
            for img in imgs:
                
                # Show the images to be send
                disp_img = np.array(img[0])
                disp_img = cv2.cvtColor(disp_img, cv2.COLOR_RGB2BGR)
                cv2.imshow('Sample image', disp_img)
                cv2.waitKey(1)

                new_work = PictureMsg(req_id, ReqType.NEW, img, label)
                zmq_serdes.send_zipped_pickle(self.socket, new_work)
                logging.info('Send works with req_id={}, label={} to backend'.format(req_id, new_work.label))
                req_id+=1

    def get_images(self, base_dir, sub_dir):
        imgs_dir = base_dir+"/"+sub_dir
        imgs = self.generate_random_sample(imgs_dir)
        return imgs

    def generate_random_sample(self, dir):
        cascade_path = os.path.abspath('./models/haarcascade_frontalface_alt2.xml')
        cascade = cv2.CascadeClassifier(cascade_path)
        file_list = os.listdir(dir)
        
        images = []
        random_range = 10 # The random range of rotation
        accepted_cnt = 0
        while accepted_cnt < 10:
            img = cv2.imread(dir+"/"+file_list[accepted_cnt % len(file_list)])
            # The angle of rotation, in degree
            rotate_angle = random.uniform(-random_range, random_range)
            random_img = self.rotate(img, rotate_angle)
            # Find the face from given image
            faces = cascade.detectMultiScale(random_img,
                                            scaleFactor=1.1,
                                            minNeighbors=3)
            margin = 10
            # If there is no face found, try again
            if len(faces) == 0:
                continue
            else:
                random_img = cv2.cvtColor(random_img, cv2.COLOR_BGR2RGB)
                random_img = np.expand_dims(random_img, axis=0)
                images.append(random_img)
                accepted_cnt += 1
                
        return images

    def rotate(self, image, angle, center=None, scale=1.0):
        (h, w) = image.shape[:2]
    
        if center is None:
            center = (w / 2, h / 2)

        M = cv2.getRotationMatrix2D(center, angle, scale)
        rotated = cv2.warpAffine(image, M, (w, h))

        return rotated

def main():
    LOG_FORMAT = '%(asctime)s [add-face-dataset]: [%(levelname)s] %(message)s'
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

    # Start work sender thread
    work_send_thread = WorkSender(work_sender)
    work_send_thread.start()

    # Wait the children thread to be done
    work_send_thread.join()
    result_recv_thread.join()


if __name__ == "__main__":
    main()
