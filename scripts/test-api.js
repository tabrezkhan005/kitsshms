
async function testApi() {
  try {
    console.log('Fetching http://localhost:3000/api/users ...');
    const response = await fetch('http://localhost:3000/api/users');
    const status = response.status;
    console.log('Status:', status);

    const text = await response.text();
    console.log('Body:', text);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testApi();
