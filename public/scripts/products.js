//Modals
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

async function handleEmployeeCreation() {
    const modalContent = {
        header: 'Create New Employee',
        body: '',
        form: `
            <input type="hidden" name="action" value="create-employee" />
            <input type="text" name="first-name" placeholder="First Name" required />
            <input type="text" name="last-name" placeholder="Last Name" required />
            <input type="text" name="location" placeholder="Location" required />
        `,
    };

    openModal(modalContent);
}

async function prepareActionModal(action) {
    if (!action || action === 'action') {
        alert('Please choose a valid action.');
        return;
    }

    const selectedItems = Array.from(document.querySelectorAll('.select-item:checked'));
    const itemIds = selectedItems.map(item => item.dataset.id);
    

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

    let itemsToFetch = itemIds.slice();

    try {
        const response = await fetch(`/inventory?ids=${itemsToFetch.join(',')}`);
        if (!response.ok) throw new Error('Failed to fetch item details.');

        const items = await response.json();
        const filteredItems = items.filter(item => itemsToFetch.includes(item._id));

        let formContent = `
            <input type="hidden" name="action" value="${action.toLowerCase()}" />
            <input type="hidden" name="ids" value="${itemIds.join(',')}" /> <!-- Add IDs to form -->
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Size</th>
                        <th>Color</th>
                        ${action !== 'Delete' ? `<th>Starting Quantity</th><th>Input Quantity</th>` : ''}
                        ${action === 'Check-in' ? `<th>Input Cost</th>` : ''}
                        ${action === 'Delete' ? `<th>Location</th>` : ''}
                    </tr>
                </thead>
                <tbody>
                    ${filteredItems.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.size || 'N/A'}</td>
                            <td>${item.color || 'N/A'}</td>
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
                            <td colspan="${action === 'Check-in' ? '5' : '4'}">
                                <label for="employeeName">Employee Name:</label>
                                <select id="employeeName" name="employeeName" required></select>
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

        if (action === 'Check-out') {
            const employeeSelect = document.getElementById('employeeName');
            if (employeeSelect) {
                try {
                    const employeeResponse = await fetch('/employee');
                    if (!employeeResponse.ok) throw new Error('Failed to fetch employees');

                    const employees = await employeeResponse.json();
                    employeeSelect.innerHTML = employees.map(employee => `<option value="${employee.name}">${employee.name}</option>`).join('');
                } catch (err) {
                    console.error('Error fetching employees:', err);
                    alert('Error fetching employees. Please try again.');
                }
            }
        }

    } catch (err) {
        console.error('Error fetching item details:', err);
        alert('There was an error fetching item details. Please try again.');
    }
}


async function handleModalSubmit(event) {
    event.preventDefault(); // Prevent default form submission behavior

    const form = document.getElementById('modal-form');
    if (!form) {
        console.error('Form not found.');
        return;
    }

    const formData = new FormData(form);
    const action = formData.get('action');

    switch (action) {
        case 'create':
            await handleCreateItem(formData);
            break;
        case 'create-employee':
            await handleCreateEmployee(formData);
            break;
        case 'delete':
        case 'check-in':
        case 'check-out':
        case 'search':
            await handleInventoryAction(action, formData, ids);
            break;
        default:
            console.error('Invalid action:', action);
    }
}

async function handleCreateItem(formData) {
    const newItem = {
        name: formData.get('name'),
        color: formData.get('color'),
        size: formData.get('size'),
        quantity: parseInt(formData.get('quantity')) || 0,
        price: parseFloat(formData.get('price')) || 0,
        location: formData.get('location') || ''
    };

    try {
        const createResponse = await fetch('/inventory/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newItem),
            credentials: 'include',
        });

        if (!createResponse.ok) throw new Error('Failed to create item');
        const createdItem = await createResponse.json();
        console.log('Item created successfully:', createdItem);

        await createReport('Create', [createdItem]);

        fetchInventory();
    } catch (err) {
        console.error('Error creating item:', err);
        alert('There was an error creating the item. Please check the input and try again.');
    } finally {
        closeModal();
    }
}

async function handleCreateEmployee(formData) {
    const employeeFirstName = formData.get('first-name') || '';
    const employeeLastName = formData.get('last-name') || '';
    const employeeLocation = formData.get('location') || '';

    const employeeFullName = `${employeeFirstName} ${employeeLastName}`.trim();

    try {
        const checkResponse = await fetch(`/employee?name=${encodeURIComponent(employeeFullName)}`);
        if (!checkResponse.ok) throw new Error('Failed to check employee existence');

        const existingEmployees = await checkResponse.json();
        console.log('Existing Employees:', existingEmployees); // Debugging log

        if (existingEmployees.length > 0) {
            alert('Employee already exists.');
            return;
        }

        const newEmployee = {
            name: employeeFullName,
            location: employeeLocation
        };

        const createResponse = await fetch('/employee', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newEmployee),
            credentials: 'include',
        });

        if (!createResponse.ok) throw new Error('Failed to create employee');
        const createdEmployee = await createResponse.json();
        console.log('Employee created successfully:', createdEmployee);

        fetchEmployees();
    } catch (err) {
        console.error('Error creating employee:', err);
        alert('There was an error creating the employee. Please check the input and try again.');
    } finally {
        closeModal();
    }
}



async function handleInventoryAction(action, formData, ids) {
    const cartItems = ids.map(id => ({
        _id: id,
        quantity: parseInt(formData.get(`quantity-${id}`)) || 0,
        price: parseFloat(formData.get(`price-${id}`)) || 0
    }));
    const employeeName = formData.get('employeeName') || '';
    const location = formData.get('location') || '';

    console.log('Cart Items for Check-In/Check-Out:', cartItems); // Debugging log

    let endpoint;
    let body;

    if (action === 'delete') {
        endpoint = '/inventory/delete';
        body = { ids }; // Pass IDs as an object
    } else if (action === 'check-in') {
        endpoint = '/inventory/checkin';
        body = { cartItems, employeeName, location };
    } else if (action === 'check-out') {
        endpoint = '/inventory/checkout';
        body = { cartItems, employeeName, location };
    } else {
        console.error('Invalid action:', action);
        return;
    }

    try {
        const { affectedItems, totalPrice } = await calculateReport(action, ids, cartItems);

        const actionResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            credentials: 'include',
        });

        const actionResponseText = await actionResponse.text(); // Read response as text
        if (!actionResponse.ok) {
            if (actionResponseText.includes('Price must be greater than 0')) {
                alert('One or more items have an invalid price. Please provide a valid price.');
            } else {
                throw new Error(`Failed to ${action}: ${actionResponseText}`);
            }
        } else {
            console.log(`${action} successful:`, JSON.parse(actionResponseText));

            await createReport(action, affectedItems, totalPrice, employeeName);

            fetchInventory();
            handleSearch();
        }
    } catch (err) {
        console.error(`Error processing ${action}:`, err);
        alert(`Error processing ${action}: ${err.message}`);
    } finally {
        closeModal();
    }
}

//Buttons & Dropdowns
function handleReset() {
    document.getElementById('search').value = '';
    document.getElementById('category-dropdown').value = '';
    fetchInventory();
}

function updateButtonVisibility(userData) {
    const adminOnlyButtons = document.querySelectorAll('.admin-only');

    if (userData.role === 'admin') {
        adminOnlyButtons.forEach(button => button.style.display = 'block');
    } else {
        adminOnlyButtons.forEach(button => button.style.display = 'none');
    }
}

//Inventory & Search
async function fetchEmployees() {
    try {
        const response = await fetch('/employee');
        if (!response.ok) throw new Error('Failed to fetch employees');
        const employees = await response.json();
        // Update the UI or perform necessary actions with the employees data
        console.log('Employees fetched:', employees);
    } catch (err) {
        console.error('Error fetching employees:', err);
    }
}

async function fetchInventory() {
    try {
        const response = await fetch('/inventory');
        if (!response.ok) throw new Error('Failed to fetch inventory');
        displayItems(await response.json());
    } catch (err) {
        console.error('Error fetching inventory:', err);
    }
}

function displayItems(items, category) {
    const tbody = document.querySelector('.inventory-grid tbody');
    tbody.innerHTML = '';

    if (category === 'Employees') {
        items.forEach(employee => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${employee.name}</td>
                <td>${employee.location}</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
            `;
            tbody.appendChild(row);
        });
    } else {
        // Group items by name
        const itemGroups = items.reduce((groups, item) => {
            if (!groups[item.name]) {
                groups[item.name] = [];
            }
            groups[item.name].push(item);
            return groups;
        }, {});

        // Function to generate a URL-friendly image name based on the product name
        function generateImageName(productName) {
            return productName.replace(/\s+/g, '-').toLowerCase() + '.jpg'; // Replace spaces with dashes and convert to lowercase
        }

        // Function to create a row for the parent item
        function createParentRow(itemName, itemList) {
            const row = document.createElement('tr');
            row.classList.add('parent-item');
            
            const imageName = generateImageName(itemName);
            const imageUrl = `././uploads/products/${imageName}`; // Construct the image URL based on the product name
            const altImageUrl = '././uploads/products/alt-image.jpg'; // The alternative image URL

            row.innerHTML = `
                <td colspan="6">
                    <img src="${imageUrl}" alt="${itemName}" 
                         style="max-height: 3em; vertical-align: middle; margin-right: 10px;"
                         onerror="this.onerror=null;this.src='${altImageUrl}';">
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
                                <th>Location</th>
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
                                    <td>${item.location ? item.location.slice(0, 3).toUpperCase() : '-'}</td>
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

            row.addEventListener('click', () => {
                const isVisible = detailsRow.style.display === 'table-row';
                detailsRow.style.display = isVisible ? 'none' : 'table-row';
            });

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
}

async function handleSearch() {
    const searchQuery = document.getElementById('search').value.trim();
    const category = document.getElementById('category-dropdown').value;

    if (category === 'location' || category === '') {
        alert('Please choose a location from the dropdown.');
        return;
    }

    try {
        let items;
        if (category === 'Employees') {
            const response = await fetch('/employee');
            if (!response.ok) throw new Error('Failed to fetch employees');
            items = await response.json();
        } else {
            const response = await fetch(`/inventory/filter?name=${searchQuery}&location=${category}`);
            if (!response.ok) throw new Error('Failed to filter inventory');
            items = await response.json();
        }

        displayItems(items, category);
    } catch (err) {
        console.error('Error during search:', err);
    }
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

//Reports
async function calculateReport(action, ids, cartItems) {
    let affectedItems = [];
    let totalPrice = 0;

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

        totalPrice = affectedItems.reduce((total, item) => total + (item.price * item.inputQuantity), 0);

        return { affectedItems, totalPrice };

    } catch (err) {
        console.error('Error calculating report:', err);
        throw err; // Re-throw error to be handled by calling function
    }
}

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


//Setup & Auth
async function fetchSessionData() {
    try {
        const response = await fetch('/login/session');
        if (!response.ok) throw new Error('Failed to fetch session data');

        const data = await response.json();
        updateButtonVisibility(data);
    } catch (err) {
        console.error('Error fetching session data:', err);
    }
}

function setupEventListeners() {
    document.getElementById("create-new-user").addEventListener("click", function() {
    alert("Insufficient permissions for this action. Please contact your system's administrator.");
});

    document.getElementById('commit-btn').addEventListener('click', async () => {
        const action = document.getElementById('action-select').value;
        await prepareActionModal(action);
    });

    document.getElementById('create-new-product').addEventListener('click', () => {
        prepareActionModal('create');
    });

    const createEmployeeBtn = document.getElementById('create-new-employee');
    if (createEmployeeBtn) {
        createEmployeeBtn.addEventListener('click', () => {
            console.log('Create Employee button clicked'); // Debugging log
            handleEmployeeCreation();
        });
    } else {
        console.error('Create Employee button not found'); // Debugging log
    }

    document.getElementById('search-btn').addEventListener('click', async () => {
        await handleSearch();
        // Ensure the event delegation is working correctly
        document.querySelector('.inventory-grid tbody').addEventListener('click', handleExpandClick);
    });

    document.getElementById('reset-btn').addEventListener('click', handleReset);

    // Initialize the event delegation
    document.querySelector('.inventory-grid tbody').addEventListener('click', handleExpandClick);

    document.getElementById('reports').addEventListener('click', function() {
        window.location.href = '/reports.html';
    });

    document.querySelector('.inventory-grid').addEventListener('click', handleTableCellClick);


   // JavaScript to handle submenu toggle
document.getElementById('menu-toggle').addEventListener('click', function() {
    const submenu = document.getElementById('submenu');
    submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
});

// Hide submenu when an item is clicked
document.querySelectorAll('#submenu .navbar-button').forEach(item => {
    item.addEventListener('click', function() {
        const submenu = document.getElementById('submenu');
        submenu.style.display = 'none';
    });
});   
}

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchSessionData();
});
