// Fetch items from the backend and populate the table
function fetchAndDisplayItems(location) {
  fetch(`/api/items?location=${encodeURIComponent(location)}`)
    .then(response => response.json())
    .then(data => {
      const tableBody = document.querySelector('#inventory-table tbody');
      tableBody.innerHTML = ''; // Clear current table rows

      const itemsGroupedByName = {};

      data.forEach(item => {
        if (!itemsGroupedByName[item.name]) {
          itemsGroupedByName[item.name] = {
            name: item.name,
            image: item.name.toLowerCase().replace(/\s+/g, '-'),
            sizes: new Set(),
            colors: new Set(),
            quantity: item.quantity,
            cost: item.cost,
            id: item._id // Ensure you have an ID field
          };
        }
        itemsGroupedByName[item.name].sizes.add(item.size);
        itemsGroupedByName[item.name].colors.add(item.color);
      });

      Object.values(itemsGroupedByName).forEach(item => {
        const row = document.createElement('tr');
        
        const sizeOptions = Array.from(item.sizes).map(size => `<option value="${size}">${size}</option>`).join('');
        const colorOptions = Array.from(item.colors).map(color => `<option value="${color}">${color}</option>`).join('');

        row.innerHTML = `
          <td><img src="/resources/assets/${item.image}.jpg" onerror="this.src='/resources/assets/alt-image.jpg'"></td>
          <td>${item.name}</td>
          <td>
            <select class="size-dropdown">
              ${sizeOptions}
            </select>
          </td>
          <td>
            <select class="color-dropdown">
              ${colorOptions}
            </select>
          </td>
          <td>
            ${createQuantityInput(item.quantity)}
          </td>
          <td class="cost">${item.cost}</td>
          <td>
            <button class="delete-button" data-id="${item.id}">Delete</button>
          </td>
        `;

        tableBody.appendChild(row);

        const sizeDropdown = row.querySelector('.size-dropdown');
        const colorDropdown = row.querySelector('.color-dropdown');
        const deleteButton = row.querySelector('.delete-button');

        // Event listener for size dropdown change
        sizeDropdown.addEventListener('change', () => {
          updateItemDetails(item.name, sizeDropdown.value, colorDropdown.value, row, deleteButton);
        });

        // Event listener for color dropdown change
        colorDropdown.addEventListener('change', () => {
          updateItemDetails(item.name, sizeDropdown.value, colorDropdown.value, row, deleteButton);
        });
      });

      // Add event listeners for delete buttons
      document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', handleDelete);
      });
    })
    .catch(error => console.error('Error fetching items:', error));
}

// Function to create a quantity input with buttons
function createQuantityInput(quantity) {
  return `
    <div class="quantity-container input-button-wrapper">
      <button class="quantity-button" onclick="changeQuantity(-1)">-</button>
      <input type="number" class="quantity-input" value="${quantity}" min="0" />
      <button class="quantity-button" onclick="changeQuantity(1)">+</button>
    </div>
  `;
}


// Event listener for location change
document.getElementById('location-dropdown').addEventListener('change', () => {
  const selectedLocation = document.getElementById('location-dropdown').value;
  fetchAndDisplayItems(selectedLocation);
});

// Initial load
document.addEventListener('DOMContentLoaded', () => {
  fetchAndDisplayItems('Vancouver'); // Default location
});

