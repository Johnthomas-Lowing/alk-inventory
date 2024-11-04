document.getElementById('add-new-item').addEventListener('click', () => {
  const name = document.getElementById('new-item-name').value;
  const size = document.getElementById('new-item-size').value;
  const color = document.getElementById('new-item-color').value;
  const quantity = document.getElementById('new-item-quantity').value;
  const cost = document.getElementById('new-item-cost').value;
  const location = document.getElementById('location-dropdown').value; // Get selected location

  if (name && size && color && quantity && cost) {
    const newItem = { name, size, color, quantity, cost, location };

    fetch('/api/items/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([newItem]) // Wrap in an array for bulk insertion
    })
    .then(response => response.json())
    .then(result => {
      console.log('Item added successfully:', result);
      fetchAndDisplayItems(location);

      // Clear the input boxes
      document.getElementById('new-item-name').value = '';
      document.getElementById('new-item-size').value = '';
      document.getElementById('new-item-color').value = '';
      document.getElementById('new-item-quantity').value = '';
      document.getElementById('new-item-cost').value = '';
    })
    .catch(error => console.error('Error adding item:', error));
  } else {
    console.error('Please fill in all fields.');
  }
});
