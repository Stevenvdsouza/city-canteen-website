
let scheduleData = [];
let rowCounter = 1;


const hoursContainer = document.querySelector('.hours-container');
const addHoursBtn = document.getElementById('add-hours-btn');
const saveHoursBtn = document.getElementById('save-hours-btn');
const statusMessage = document.getElementById('status-message');


function init() {
  addHoursBtn.addEventListener('click', addNewRow);
  saveHoursBtn.addEventListener('click', saveHours);

  
  attachRowListeners(document.querySelector('.schedule-row'));
}

/**
 * Generate a unique ID for each row
 * @returns {number} Unique row ID
 */
function generateRowId() {
  return rowCounter++;
}

/**
 * Create a new schedule row HTML element
 * @param {number} rowId - Unique identifier for the row
 * @returns {HTMLElement} The new schedule row element
 */
function createRowElement(rowId) {
  const rowDiv = document.createElement('div');
  rowDiv.className = 'schedule-row';
  rowDiv.setAttribute('data-row-id', rowId);

  rowDiv.innerHTML = `
    <div class="field-group">
      <label for="day-${rowId}" class="field-label">Day</label>
      <select id="day-${rowId}" class="day-select" required>
        <option value="">Select Day</option>
        <option value="Monday">Monday</option>
        <option value="Tuesday">Tuesday</option>
        <option value="Wednesday">Wednesday</option>
        <option value="Thursday">Thursday</option>
        <option value="Friday">Friday</option>
        <option value="Saturday">Saturday</option>
        <option value="Sunday">Sunday</option>
      </select>
    </div>

    <div class="field-group">
      <label for="from-time-${rowId}" class="field-label">From</label>
      <input type="time" id="from-time-${rowId}" class="time-input from-time" required>
    </div>

    <div class="field-group">
      <label for="to-time-${rowId}" class="field-label">To</label>
      <input type="time" id="to-time-${rowId}" class="time-input to-time" required>
    </div>

    <button class="btn btn-remove" aria-label="Remove row">
      <span class="remove-icon">×</span>
    </button>
  `;

  return rowDiv;
}

/**
 * Attach event listeners to a schedule row
 * @param {HTMLElement} rowElement - The schedule row element
 */
function attachRowListeners(rowElement) {
  const removeBtn = rowElement.querySelector('.btn-remove');
  removeBtn.addEventListener('click', () => removeRow(rowElement));
}


function addNewRow() {
  const newRowId = generateRowId();
  const newRowElement = createRowElement(newRowId);

  hoursContainer.appendChild(newRowElement);
  attachRowListeners(newRowElement);

  // Focus on the newly added row's day select
  newRowElement.querySelector('.day-select').focus();

  showStatusMessage('New row added', 'success');
}

/**
 * Remove a schedule row
 * @param {HTMLElement} rowElement - The row to remove
 */
function removeRow(rowElement) {
  // Check if this is the last row
  const rows = document.querySelectorAll('.schedule-row');
  if (rows.length <= 1) {
    showStatusMessage('At least one row must remain', 'error');
    return;
  }

  rowElement.remove();
  showStatusMessage('Row removed', 'success');
}

/**
 * Validate time entries in a row
 * @param {HTMLElement} rowElement - The row to validate
 * @returns {object} Validation result with success flag and error message
 */
function validateRow(rowElement) {
  const daySelect = rowElement.querySelector('.day-select');
  const fromTime = rowElement.querySelector('.from-time');
  const toTime = rowElement.querySelector('.to-time');

  
  if (!daySelect.value) {
    return {
      success: false,
      message: 'Please select a day'
    };
  }

  
  if (!fromTime.value || !toTime.value) {
    return {
      success: false,
      message: 'Please enter both From and To times'
    };
  }

  
  if (fromTime.value >= toTime.value) {
    return {
      success: false,
      message: `"To" time must be after "From" time for ${daySelect.value}`
    };
  }

  return {
    success: true,
    message: ''
  };
}

/**
 * Collect schedule data from all rows
 * @returns {array} Array of schedule objects
 */
function collectScheduleData() {
  const rows = document.querySelectorAll('.schedule-row');
  const data = [];

  rows.forEach(row => {
    const day = row.querySelector('.day-select').value;
    const fromTime = row.querySelector('.from-time').value;
    const toTime = row.querySelector('.to-time').value;

    data.push({
      day,
      fromTime,
      toTime
    });
  });

  return data;
}


function saveHours() {
  const rows = document.querySelectorAll('.schedule-row');

 
  for (const row of rows) {
    const validation = validateRow(row);

    if (!validation.success) {
      showStatusMessage(validation.message, 'error');
      return;
    }
  }

 
  scheduleData = collectScheduleData();

  
  showStatusMessage(`✓ Successfully saved ${scheduleData.length} schedule(s)!`, 'success');

  
  console.log('Saved Schedule Data:', scheduleData);
}

/**
 * Display status message
 * @param {string} message - The message to display
 * @param {string} type - Message type: 'success' or 'error'
 */
function showStatusMessage(message, type = 'success') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message show ${type}`;

  
  setTimeout(() => {
    statusMessage.classList.remove('show');
  }, 4000);
}


document.addEventListener('DOMContentLoaded', init);
