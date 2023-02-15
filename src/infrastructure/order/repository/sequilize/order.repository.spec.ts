import { Sequelize } from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a new order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const ordemItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("123", "123", [ordemItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: ordemItem.id,
          name: ordemItem.name,
          price: ordemItem.price,
          quantity: ordemItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });


  it("should update a order", async () => {
    //arrange
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    const anotherProduct = new Product("123456", "Product 2", 10);
    await productRepository.create(product);
    await productRepository.create(anotherProduct);

    const ordemItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("123", "123", [ordemItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);
    
    const anotherOrderItem = new OrderItem(
      "2",
      anotherProduct.name,
      anotherProduct.price,
      anotherProduct.id,
      2
    );

    //act
    order.addItem(anotherOrderItem);
    await orderRepository.update(order);


    //assert
    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    })
    
    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: ordemItem.id,
          name: ordemItem.name,
          price: ordemItem.price,
          quantity: ordemItem.quantity,
          order_id: "123",
          product_id: "123",
        },
        {
          id: anotherOrderItem.id,
          name: anotherOrderItem.name,
          price: anotherOrderItem.price,
          quantity: anotherOrderItem.quantity,
          order_id: "123",
          product_id: "123456",
        },
      ],
    });    
  });



  it("should find a order", async () => {
    //arrange
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const ordemItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      1
    );

    const order = new Order("123", "123", [ordemItem]);
    const orderRepository = new OrderRepository();
    await orderRepository.create(order);
    
    // act
    const orderResult = await orderRepository.find(order.id);
    
    //assert
    expect(order).toStrictEqual(orderResult);
  });

  it('should find all products', async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Sérgio");
    const address = new Address(
      "Rua 1",
      965,
      "123456788",
      "São Paulo"
    );
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const productOne = new Product("123", "Product 1", 10);
    await productRepository.create(productOne);

    const productTwo = new Product("456", "Product 2", 20);
    await productRepository.create(productTwo);

    const orderItemOne = new OrderItem(
      "1",
      productOne.name,     
      productOne.price,
      productOne.id, 
      2
    );

    const orderItemTwo = new OrderItem(
      "2",           
      productTwo.name,
      productTwo.price,
      productTwo.id,
      2
    );

    const orderRepository = new OrderRepository();
    const order = new Order("1", customer.id, [orderItemOne]);
    await orderRepository.create(order);

    const order2 = new Order("2", customer.id, [orderItemTwo]);
    await orderRepository.create(order2);

    const result = await orderRepository.findAll();

    expect(result.length).toEqual(2);
  });

});