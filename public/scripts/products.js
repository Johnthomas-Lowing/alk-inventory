//modal
function openModal(modalContent) {
    const modal = document.getElementById('general-modal');
    document.getElementById('modal-header').innerHTML = modalContent.header;
    document.getElementById('modal-body').innerHTML = modalContent.body;
    document.getElementById('modal-form').innerHTML = modalContent.form;
    modal.style.display = 'flex';

    //Prevent stale listeners.
    const confirmBtn = document.getElementById('modal-confirm-btn');
    if (confirmBtn) {
        confirmBtn.removeEventListener('click', handleModalSubmit);
        confirmBtn.addEventListener('click', handleModalSubmit);
    }

    const cancelBtn = document.getElementById('modal-cancel-btn');
    if (cancelBtn) {
        cancelBtn.removeEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
    }
}

function closeModal() {
    document.getElementById('general-modal').style.display = 'none';
}

async function prepareActionModal(action) {
    const selectedItems = Array.from(document.querySelectorAll('.select-item:checked'));
    const itemIds = selectedItems.map(item => item.dataset.id);

    //Item creation
    if (action === 'create') {
        const modalContent = {
            header: 'Create New Product',
            body: '',
            form: `
                <input type="hidden" name="action" value="create" />
                <input type="text" name="location" placeholder="Location" required />
                <input type="text" name="name" placeholder="Name" required />
                <input type="number" name="price" placeholder="Price" required />
                <input type="text" name="size" placeholder="Size" />
                <input type="text" name="color" placeholder="Color" />
                <input type="number" name="quantity" placeholder="Starting Quantity" required />
            `,
        };
        openModal(modalContent);
        return;
    }


    if (selectedItems.length === 0) {
        alert('No items selected for action.');
        return;
    }

    
    try {
        const response = await fetch(`/inventory?ids=${itemIds.join(',')}`);
        if (!response.ok) throw new Error('Failed to fetch item details.');

        const items = await response.json();
        const filteredItems = items.filter(item => itemIds.includes(item._id));

        let formContent = `
            <input type="hidden" name="action" value="${action.toLowerCase()}" />
            <input type="hidden" name="ids" value="${itemIds.join(',')}" />
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        ${action !== 'Delete' ? `<th>Starting Quantity</th><th>Input Quantity</th>` : ''}
                        ${action === 'Check-in' ? `<th>Input Cost</th>` : ''}
                        ${action === 'Delete' ? `<th>Location</th>` : ''}
                    </tr>
                </thead>
                <tbody>
                    ${filteredItems.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            ${action !== 'Delete' ? `
                                <td>${item.quantity}</td>
                                <td>
                                    <input type="number" id="quantity-${item._id}" name="quantity-${item._id}" required />
                                </td>
                                ${action === 'Check-in' ? `
                                    <td>
                                        <input type="number" id="price-${item._id}" name="price-${item._id}" value="${item.price.toFixed(2)}" required />
                                    </td>
                                ` : ''}
                            ` : ''}
                            ${action === 'Delete' ? `
                                <td>${item.location}</td>
                            ` : ''}
                        </tr>
                    `).join('')}
                    ${action === 'Check-out' ? `
                        <tr>
                            <td colspan="${action === 'Check-in' ? '4' : '3'}">
                                <label for="employeeName">Employee Name:</label>
                                <input type="text" id="employeeName" name="employeeName" required />
                            </td>
                        </tr>
                    ` : ''}
                </tbody>
            </table>
            ${action === 'Delete' ? `
                <p>Are you sure you want to delete the selected items? This action cannot be undone.</p>
            ` : ''}
        `;

        const modalContent = {
            header: `Confirm ${action}`,
            body: '',
            form: formContent,
        };
        openModal(modalContent);
    } catch (err) {
        console.error('Error fetching item details:', err);
        alert('There was an error fetching item details. Please try again.');
    }
}

async function handleModalSubmit(event) {
    event.preventDefault(); // Prevent the default form submission behavior
    console.log('Confirm button clicked'); // Debugging log

    const form = document.getElementById('modal-form');
    if (!form) {
        console.error('Form not found.');
        return;
    }

    const formData = new FormData(form);
    const action = formData.get('action');
    const idsString = formData.get('ids');
    const ids = idsString ? idsString.split(',') : [];

    console.log('Form Data:', { action, ids }); // Debugging log

    let endpoint, requestBody;
    const employeeName = formData.get('employeeName') || '';

    if (action === 'create') {
        // Handle creation of a new product
        const newItem = {
            name: formData.get('name'),
            color: formData.get('color'),
            size: formData.get('size'),
            quantity: parseInt(formData.get('quantity')) || 0,
            price: parseFloat(formData.get('price')) || 0,
            location: formData.get('location') || ''
        };

        endpoint = '/inventory/add'; // Correct endpoint for creation
        requestBody = newItem;

        try {
            const createResponse = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                credentials: 'include',
            });

            if (!createResponse.ok) throw new Error('Failed to create item');
            const createdItem = await createResponse.json();
            console.log('Item created successfully:', createdItem);

            // Generate a report after item creation
            await createReport('Create', [createdItem]);

            // Refresh inventory list
            fetchInventory();
            handleSearch();
        } catch (err) {
            console.error('Error creating item:', err);
        } finally {
            closeModal();
        }

        return; // Ensure no further code runs for 'create' action
    }

    // Handle other actions (delete, check-in, check-out)
    if (action !== 'delete' && action !== 'check-in' && action !== 'check-out') {
        console.error('Invalid action:', action);
        return;
    }

    // Prepare quantities and prices for each item
    const cartItems = ids.map(id => ({
        _id: id,
        quantity: parseInt(formData.get(`quantity-${id}`)) || 0,
        price: parseFloat(formData.get(`price-${id}`)) || 0 // Ensure price is included
    }));

    console.log('Cart Items for Check-In/Check-Out:', cartItems); // Debugging log

    // Check for stock availability if action is check-out
    if (action === 'check-out') {
        try {
            const stockResponse = await fetch(`/inventory?ids=${ids.join(',')}`);
            if (!stockResponse.ok) throw new Error('Failed to fetch stock details');
            const stockItems = await stockResponse.json();

            const insufficientStock = cartItems.some(cartItem => {
                const stockItem = stockItems.find(item => item._id === cartItem._id);
                return stockItem && cartItem.quantity > stockItem.quantity;
            });

            if (insufficientStock) {
                alert('Requested quantity exceeds available stock for one or more items.');
                return;
            }
        } catch (err) {
            console.error('Error checking stock availability:', err);
            alert('There was an error checking stock availability. Please try again.');
            return;
        }
    }

    // Set the endpoint and requestBody based on the action
    if (action === 'delete') {
        endpoint = '/inventory/delete';
        requestBody = { ids };
    } else if (action === 'check-in' || action === 'check-out') {
        endpoint = action === 'check-in' ? '/inventory/checkin' : '/inventory/checkout';
        requestBody = { cartItems, employeeName };
    }

    let affectedItems = [];
    let totalPrice = 0;

    // Fetch affected items before performing the action
    try {
        const itemsResponse = await fetch(`/inventory?ids=${ids.join(',')}`);
        if (!itemsResponse.ok) throw new Error('Failed to fetch affected items');
        affectedItems = await itemsResponse.json();

        // Filter affectedItems based on the action
        affectedItems = affectedItems.filter(item => ids.includes(item._id));

        affectedItems = affectedItems.map(item => {
            const cartItem = cartItems.find(cartItem => cartItem._id === item._id);
            return {
                ...item,
                quantity: cartItem.quantity, // Directly use user-submitted quantity
                inputQuantity: cartItem.quantity // Ensure this is correctly set
            };
        });

        console.log('Affected Items with User-Submitted Quantities:', affectedItems); // Debugging log

        if (action === 'check-out') {
            totalPrice = affectedItems.reduce((total, item) => total + (item.price * item.inputQuantity), 0);
        }

        console.log('Generating Report:', { action, affectedItems, totalPrice, employeeName }); // Debugging log
        // Generate the report with affected items
        await createReport(action, affectedItems, totalPrice, employeeName);

        // Perform the action
        const actionResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            credentials: 'include',
        });

        if (!actionResponse.ok) throw new Error(`Failed to ${action}`);
        console.log(`${action} successful:`, await actionResponse.json());

        // Refresh inventory list
        fetchInventory();
        handleSearch();
    } catch (err) {
        console.error(`Error processing ${action}:`, err);
    } finally {
        closeModal();
    }
}

//reports
async function createReport(action, items, totalPrice = 0, employeeName = '') {
    try {
        const response = await fetch('/login/session');
        if (!response.ok) throw new Error('Failed to fetch username');

        const data = await response.json();
        const username = data.username;

        const report = {
            username,
            action,
            items: items.map(item => ({
                ...item,
                inputQuantity: item.inputQuantity // Ensure inputQuantity is included and used
            })),
            totalPrice,
            employeeName
        };

        console.log('Report Payload:', report); // Debugging log

        const reportResponse = await fetch('/reports', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(report),
        });

        if (!reportResponse.ok) throw new Error('Failed to create report');
        console.log('Report created:', await reportResponse.json());
    } catch (err) {
        console.error('Error creating report:', err);
    }
}

//inventory
async function fetchInventory() {
    try {
        const response = await fetch('/inventory');
        if (!response.ok) throw new Error('Failed to fetch inventory');
        displayItems(await response.json());
    } catch (err) {
        console.error('Error fetching inventory:', err);
    }
}

function displayItems(items) {
    const tbody = document.querySelector('.inventory-grid tbody');
    tbody.innerHTML = '';

    // Group items by name
    const itemGroups = items.reduce((groups, item) => {
        if (!groups[item.name]) {
            groups[item.name] = [];
        }
        groups[item.name].push(item);
        return groups;
    }, {});

    // Function to create a row for the parent item
    function createParentRow(itemName, itemList) {
        const row = document.createElement('tr');
        row.classList.add('parent-item');
        row.innerHTML = `
            <td colspan="6">
                <button class="expand-btn">+</button>
                ${itemName}
            </td>
        `;

        const detailsRow = document.createElement('tr');
        detailsRow.classList.add('details-row');
        detailsRow.style.display = 'none'; // Hidden by default
        detailsRow.innerHTML = `
            <td colspan="6">
                <table class="subtable">
                    <thead>
                        <tr>
                            <th></th>
                            <th>Color</th>
                            <th>Size</th>
                            <th>Quantity</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemList.map(item => `
                            <tr>
                                <td class="table-checkbox">
                                    <input type="checkbox" class="select-item" data-id="${item._id}">
                                    <span class="custom-checkbox"></span>
                                </td>

                                <td>${item.color || '-'}</td>
                                <td>${item.size || '-'}</td>
                                <td>${item.quantity}</td>
                                <td>$${item.price.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </td>
        `;

        tbody.appendChild(row);
        tbody.appendChild(detailsRow);
    }

    // Create rows for each group, sorting item names alphabetically
    const sortedItemGroups = Object.entries(itemGroups).sort(([nameA], [nameB]) => nameA.localeCompare(nameB));
    
    for (const [name, items] of sortedItemGroups) {
        createParentRow(name, items);
    }

    // Add event listeners for expanding/collapsing rows
    tbody.addEventListener('click', handleExpandClick);
}

async function handleSearch() {
    const searchQuery = document.getElementById('search').value.trim();
    const category = document.getElementById('category-dropdown').value;

    if (category === 'location' || category === '') {
        alert('Please choose a location from the dropdown.');
        return; // Exit the function to prevent the search from running
    }

    try {
        const response = await fetch(`/inventory/filter?name=${searchQuery}&location=${category}`);
        if (!response.ok) throw new Error('Failed to filter inventory');
        displayItems(await response.json());
    } catch (err) {
        console.error('Error filtering inventory:', err);
    }
}

function handleReset() {
    document.getElementById('search').value = '';
    document.getElementById('category-dropdown').value = '';
    fetchInventory();
}

function handleExpandClick(event) {
    if (event.target.classList.contains('expand-btn')) {
        const parentRow = event.target.closest('tr');
        const detailsRow = parentRow.nextElementSibling;
        const isVisible = detailsRow.style.display === 'table-row';
        detailsRow.style.display = isVisible ? 'none' : 'table-row';
        event.target.textContent = isVisible ? '+' : '-';
    }
}

function handleTableCellClick(event) {
    const cell = event.target.closest('.table-checkbox');
    if (cell) {
        const checkbox = cell.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.checked = !checkbox.checked; // Toggle checkbox state
        }
    }
}




// Event listeners setup
function setupEventListeners() {
    document.getElementById('search-btn').addEventListener('click', async () => {
        await handleSearch();
        // Ensure the event delegation is working correctly
        document.querySelector('.inventory-grid tbody').addEventListener('click', handleExpandClick);
    });

    document.getElementById('reset-btn').addEventListener('click', handleReset);

    // Initialize the event delegation
    document.querySelector('.inventory-grid tbody').addEventListener('click', handleExpandClick);

    document.getElementById('reports').addEventListener('click', function() {
        window.location.href = '/reports.html'
    });

    document.querySelector('.inventory-grid').addEventListener('click', handleTableCellClick);
}



// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('commit-btn').addEventListener('click', async () => {
    const action = document.getElementById('action-select').value;

    if (action !== 'create' && (action === 'location' || action === '')) {
        alert('Please choose a location from the dropdown.');
        return; // Exit the function to prevent further processing
    }

    await prepareActionModal(action);
});

    document.getElementById('create-new-product').addEventListener('click', () => {
        prepareActionModal('create');
    });

    setupEventListeners();
});
