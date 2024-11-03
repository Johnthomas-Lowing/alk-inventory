document.getElementById('tool-dropdown').addEventListener('change', function() {
  const selectedValue = this.value;
  const locationDropdown = document.getElementById('location-dropdown');
  const dropdownLabel = document.querySelector('label[for="location-dropdown"]');

  if (selectedValue === 'assets') {
    dropdownLabel.textContent = 'Location:';
    locationDropdown.innerHTML = `
      <option value="Vancouver">Vancouver</option>
      <option value="Arizona">Arizona</option>
      <option value="Seattle">Seattle</option>
    `;
  } else if (selectedValue === 'tracker') {
    dropdownLabel.textContent = 'Guard:';
    
    // Fetch the list of guards from the correct endpoint
    fetch('/guards')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch guards');
        }
        return response.json();
      })
      .then(guards => {
        locationDropdown.innerHTML = '';  // Clear the dropdown

        // Populate the dropdown with guard options
        guards.forEach(guard => {
          const option = document.createElement('option');
          option.value = guard._id;  // Use guard ID as the value
          option.textContent = `${guard.nameOne} ${guard.nameTwo}`;  // Guard's full name
          locationDropdown.appendChild(option);
        });
      })
      .catch(error => {
        console.error('Error fetching guards:', error.message);
      });
  }
});
