// Function to handle delete action
function handleDelete(event) {
  const button = event.target;
  const itemId = button.getAttribute('data-id'); // Make sure this is correct

  if (confirm(`Are you sure you want to delete ${itemId}?`)) {
    fetch(`/api/items/${itemId}`, {
      method: 'DELETE'
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => {
          console.error('Failed to delete item:', {
            status: response.status,
            statusText: response.statusText,
            error: err
          });
          return Promise.reject(err);
        });
      }
      return response.json();
    })
    .then(result => {
      if (result.success) {
        console.log('Item deleted successfully');
        // Refresh the table
        const location = document.getElementById('location-dropdown').value;
        fetchAndDisplayItems(location);
      } else {
        console.error('Failed to delete item:', result.message);
      }
    })
    .catch(error => {
      console.error('Error deleting item:', error);
    });
  }
}
// Function to fetch and update item details based on dropdown selections
function updateItemDetails(name, size, color, row, deleteButton) {
  const location = document.getElementById('location-dropdown').value; // Get selected location
  fetch(`/api/items?name=${encodeURIComponent(name)}&size=${encodeURIComponent(size)}&color=${encodeURIComponent(color)}&location=${encodeURIComponent(location)}`)
    .then(response => response.json())
    .then(items => {
      if (items.length > 0) {
        const item = items[0]; // Assuming there's only one item per combination
        // Update the quantity and cost fields in the table
        row.querySelector('.quantity-input').value = item.quantity;
        row.querySelector('.cost').textContent = item.cost;

        // Update the delete button's data-id with the correct item ID
        deleteButton.setAttribute('data-id', item._id);
      } else {
        // Handle case where no matching item is found
        row.querySelector('.quantity-input').value = 'N/A';
        row.querySelector('.cost').textContent = 'N/A';
        deleteButton.setAttribute('data-id', ''); // Clear the data-id
      }
    })
    .catch(error => console.error('Error fetching item details:', error));
}

// Function to handle quantity change
function changeQuantity(amount) {
  const input = event.target.parentElement.querySelector('.quantity-input');
  let currentQuantity = parseInt(input.value, 10);
  if (isNaN(currentQuantity)) currentQuantity = 0;
  
  // Update the input value
  input.value = Math.max(currentQuantity + amount, 0); // Ensure quantity doesn't go below 0

  // Update the database
  const row = event.target.closest('tr');
  const itemName = row.querySelector('td:nth-child(2)').textContent;
  const selectedSize = row.querySelector('.size-dropdown').value;
  const selectedColor = row.querySelector('.color-dropdown').value;
  const newQuantity = input.value;

  updateItemQuantity(itemName, selectedSize, selectedColor, newQuantity);
}

function updateItemQuantity(name, size, color, quantity) {
  fetch('/api/items/updateQuantity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, size, color, quantity })
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => {
        console.error('Failed to update quantity:', {
          status: response.status,
          statusText: response.statusText,
          error: err
        });
        return Promise.reject(err);
      });
    }
    return response.json();
  })
  .then(result => {
    if (result.success) {
      console.log('Quantity updated successfully');
    } else {
      console.error('Failed to update quantity:', result.message);
    }
  })
  .catch(error => {
    // General error handling for network issues
    console.error('Error updating quantity:', error);
  });
}

