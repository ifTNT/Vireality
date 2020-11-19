




# 類神經網路結構
# def create_base_network(image_input_shape, embedding_size):
#     """
#     Base network to be shared (eq. to feature extraction).
#     """
#     input_image = Input(shape=image_input_shape)

#     x = Flatten()(input_image)
#     x = Dropout(0.1)(x)
#     # x = Dense(128, activation='relu')(x)
#     # x = Dropout(0.1)(x)
#     x = Dense(128, activation='sigmoid')(x)
#     x = Dropout(0.1)(x)
#     x = Dense(embedding_size)(x)
#     x = Lambda(lambda x :nn.l2_normalize(x, axis=1, epsilon=1e-10))(x)

#     base_network = Model(inputs=input_image, outputs=x)
#     # plot_model(base_network, to_file='base_network.png', show_shapes=True, show_layer_names=True)
#     return base_network

#   using network
    # testing_embeddings = create_base_network(input_image_shape,
    #                                          embedding_size=embedding_size)
    # # Grabbing the weights from the trained network
    # for layer_target, layer_source in zip(testing_embeddings.layers, model.layers[2].layers):
    #     weights = layer_source.get_weights()
    #     layer_target.set_weights(weights)
    #     del weights

    # x_embeddings = testing_embeddings.predict(np.reshape(img_input, (len(img_input)), 28, 28, 1)))