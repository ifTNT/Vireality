from keras.models import Model, load_model
from keras.layers import Input, Flatten, Dense, concatenate,  Dropout, Lambda
from tensorflow.python.ops import nn
from common.protocol.constant import *

# Create base network to be shared between train-unit and recog-unit
def create_base_network(input_shape=NN_INPUT_SHAPE(), embedding_size=EMBEDDING_SIZE()):
  
    input_feature = Input(shape=input_shape)

    x = Dropout(0.1)(input_feature)
    x = Dense(512, activation='sigmoid')(x)
    x = Dropout(0.1)(x)
    x = Dense(embedding_size, activation=None)(x)
    x = Lambda(lambda x :nn.l2_normalize(x, axis=1, epsilon=1e-10))(x)

    base_network = Model(inputs=input_feature, outputs=x)

    return base_network