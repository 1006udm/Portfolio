document.getElementById('expandable-text').addEventListener('click', function() {
    var additionalContent = document.getElementById('additional-content');
    additionalContent.classList.toggle('show');
});

$('input').on('change', function() {
    $('body').toggleClass('blue');
  });
  

  document.querySelector('.viewAll').addEventListener('click', function() {
    var additionalContent = document.getElementById('additional-content');
    additionalContent.classList.toggle('show');
});


// Function to toggle the blur effect on click
function toggleBlur(imageElement) {
  imageElement.classList.toggle('blurred');
}

// Function to open a specific form
function openForm(formId) {
  document.getElementById(formId).style.display = 'block';
}

// Function to close a specific form
function closeForm(formId) {
  document.getElementById(formId).style.display = 'none';
}

// Function to remove the blur effect when closing the form
function removeBlur() {
  // Remove the 'blurred' class from the image inside '.code-imitation'
  var imageElement = document.querySelector('.code-imitation img');
  if (imageElement) {
    imageElement.classList.remove('blurred');
  }
}

// Toggle the visibility of additional content
document.querySelector('.viewAll').addEventListener('click', function() {
  var additionalContent = document.getElementById('additional-content');
  additionalContent.classList.toggle('show');
});





