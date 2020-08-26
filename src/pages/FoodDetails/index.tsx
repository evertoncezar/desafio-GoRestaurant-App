import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image, Alert } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id

      const response = await api.get(`foods/${routeParams.id}`);

      setFood(response.data);

      const parsedExtras = response.data.extras.map((extra: Food) => {
        return { ...extra, quantity: 0 };
      });
      setExtras(parsedExtras);
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    // Increment extra quantity
    const incExtras = extras.map((extra: Extra) => {
      if (extra.id === id) {
        return { ...extra, quantity: extra.quantity ? extra.quantity + 1 : 1 };
      }

      return extra;
    });

    setExtras(incExtras);
  }

  function handleDecrementExtra(id: number): void {
    // Decrement extra quantity
    const decExtras = extras.map((extra: Extra) => {
      if (extra.id === id) {
        if (extra.quantity) {
          if (extra.quantity <= 0) return extra;

          return {
            ...extra,
            quantity: extra.quantity - 1,
          };
        }
      }

      return extra;
    });

    setExtras(decExtras);
  }

  function handleIncrementFood(): void {
    // Increment food quantity

    setFoodQuantity(foodQuantity + 1);
  }

  function handleDecrementFood(): void {
    // Decrement food quantity
    if (foodQuantity <= 1) return;

    setFoodQuantity(foodQuantity - 1);
  }

  const toggleFavorite = useCallback(async () => {
    // Toggle if food is favorite or not

    setIsFavorite(!isFavorite);

    if (!isFavorite) {
      await api.post('/favorites', food);
    }
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal
    const totalExtras = extras.reduce((sum, item: Extra) => {
      // eslint-disable-next-line prettier/prettier
      return sum + (item.quantity * item.value);
    }, 0);

    const total =
      (parseFloat(food.price) + parseFloat(totalExtras)) * foodQuantity;

    return formatValue(total);
  }, [food, extras, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API

    const orderExtras = extras.filter(extra => {
      return extra.quantity > 0;
    });

    const response = await api.get(`foods/${routeParams.id}`);
    const cadfood = response.data;
    delete cadfood.id;

    const orderFood = {
      ...cadfood,
      product_id: food.id,
      price: food.price,
      extras: orderExtras,
    };

    const responsePost = await api.post('orders', orderFood);

    responsePost.status === 201
      ? Alert.alert('Pedido realizado com sucesso!')
      : Alert.alert(
          'Ocorreu um erro ao tentar realizar o Pedido, tente novamente!',
        );

    navigation.navigate('Orders');
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
