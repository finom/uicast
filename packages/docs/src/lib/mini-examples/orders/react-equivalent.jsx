// The same UI, written by hand in React.
function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    listOrders().then(setOrders);
  }, []);

  return (
    <Card>
      <Heading>{orders.length} orders</Heading>
      <Button onClick={() => listOrders().then(setOrders)}>Refresh</Button>
      {orders.map((order) => (
        <OrderRow key={order.id} customer={order.customer} total={order.total} />
      ))}
    </Card>
  );
}
