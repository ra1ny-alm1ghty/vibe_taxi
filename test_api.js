const axios = require('axios');

async function runTests() {
  const baseUrl = 'http://127.0.0.1:3000';
  const authPass = {username: 'passenger_demo', password: 'pass123'};
  const authDrive = {username: 'driver_demo', password: 'drive123'};
  const authAdmin = {username: 'admin_demo', password: 'admin123'};

  const login = await axios.post(`${baseUrl}/login`, authPass);
  console.log('Login passenger:', login.data);

  const orderRes = await axios.post(
    `${baseUrl}/order`,
    {from_lat: 56.8389, from_lon: 60.6057, to_lat: 56.845, to_lon: 60.615},
    {headers: authPass},
  );
  console.log('Order:', orderRes.data);
  const orderId = orderRes.data.id;

  const acceptRes = await axios.post(`${baseUrl}/order/accept`, {orderId}, {headers: authDrive});
  console.log('Accepted:', acceptRes.data.status);

  await axios.post(`${baseUrl}/order/status`, {orderId, status: 'ARRIVED'}, {headers: authDrive});
  await axios.post(`${baseUrl}/order/status`, {orderId, status: 'IN_PROGRESS'}, {headers: authDrive});
  const done = await axios.post(`${baseUrl}/order/status`, {orderId, status: 'COMPLETED'}, {headers: authDrive});
  console.log('Completed:', done.data.status);

  const order2 = await axios.post(
    `${baseUrl}/order`,
    {from_lat: 56.84, from_lon: 60.61, to_lat: 56.85, to_lon: 60.62},
    {headers: authPass},
  );
  const cancelled = await axios.post(
    `${baseUrl}/admin/order/manage`,
    {orderId: order2.data.id, action: 'CANCEL'},
    {headers: authAdmin},
  );
  console.log('Admin cancel:', cancelled.data.status);
}

runTests().catch(error => {
  console.error(error.response ? error.response.data : error.message);
  process.exit(1);
});
