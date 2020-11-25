# The input image shape of deep-unit.
# The width and hight is both 160px.
# The color channel is 3.
# Due to the origin model is batch input, the input array need to be 4-dims
IMAGE_SIZE = lambda: 160
DEEP_INPUT_SHAPE = lambda: (1, IMAGE_SIZE(), IMAGE_SIZE(), 3)


# The size of feature vector
FEATURE_SIZE = lambda: 1792

# The output feature shape of deep-unit
FEATURE_SHAPE = lambda: (1,FEATURE_SIZE())

# The shape of input layer of internal neural network
NN_INPUT_SHAPE = lambda: (FEATURE_SIZE(), )

# The input array of training-unit
# The recognize scheduler should arange 10 features into on training bundle
TRAIN_INPUT_SHAPE = lambda: (10, FEATURE_SIZE())

# The size of calculated embedding
EMBEDDING_SIZE = lambda: 64