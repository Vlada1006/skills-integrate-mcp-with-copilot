document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  
  // Modal elements
  const userIcon = document.getElementById("user-icon");
  const userMenuModal = document.getElementById("user-menu-modal");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  const userDisplay = document.getElementById("user-display");
  const openLoginBtn = document.getElementById("open-login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const logoutSection = document.getElementById("logout-section");
  const userMenuButtons = document.getElementById("user-menu-buttons");
  
  let currentUser = null;

  // Check current user on page load
  async function checkCurrentUser() {
    try {
      const response = await fetch("/current-user");
      const data = await response.json();
      currentUser = data.user;
      updateUIBasedOnAuth();
    } catch (error) {
      console.error("Error checking user:", error);
    }
  }

  // Update UI based on authentication status
  function updateUIBasedOnAuth() {
    const signupContainer = document.getElementById("signup-container");
    
    if (currentUser) {
      userDisplay.textContent = `Logged in as: ${currentUser}`;
      userMenuButtons.classList.add("hidden");
      logoutSection.classList.remove("hidden");
      signupContainer.style.display = "block";
    } else {
      userDisplay.textContent = "Not Logged In";
      userMenuButtons.classList.remove("hidden");
      logoutSection.classList.add("hidden");
      signupContainer.style.display = "none";
    }
    
    updateDeleteButtons();
  }

  // Update delete button visibility based on auth
  function updateDeleteButtons() {
    const deleteButtons = document.querySelectorAll(".delete-btn");
    if (currentUser) {
      deleteButtons.forEach(btn => btn.style.display = "block");
    } else {
      deleteButtons.forEach(btn => btn.style.display = "none");
    }
  }

  // Modal controls
  userIcon.addEventListener("click", () => {
    userMenuModal.classList.remove("hidden");
  });

  openLoginBtn.addEventListener("click", () => {
    userMenuModal.classList.add("hidden");
    loginModal.classList.remove("hidden");
  });

  // Close modals
  document.querySelectorAll(".close").forEach((closeBtn) => {
    closeBtn.addEventListener("click", (e) => {
      e.target.closest(".modal").classList.add("hidden");
    });
  });

  window.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal")) {
      event.target.classList.add("hidden");
    }
  });

  // Handle login
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch(
        `/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        currentUser = result.username;
        loginMessage.textContent = result.message;
        loginMessage.className = "success";
        loginForm.reset();

        setTimeout(() => {
          loginModal.classList.add("hidden");
          loginMessage.classList.add("hidden");
        }, 1500);

        updateUIBasedOnAuth();
      } else {
        loginMessage.textContent = result.detail || "Login failed";
        loginMessage.className = "error";
      }

      loginMessage.classList.remove("hidden");
    } catch (error) {
      loginMessage.textContent = "Login error. Please try again.";
      loginMessage.className = "error";
      loginMessage.classList.remove("hidden");
      console.error("Error logging in:", error);
    }
  });

  // Handle logout
  logoutBtn.addEventListener("click", async () => {
    try {
      const response = await fetch("/logout", {
        method: "POST",
      });

      if (response.ok) {
        currentUser = null;
        userMenuModal.classList.add("hidden");
        updateUIBasedOnAuth();
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  });

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}" style="display: ${currentUser ? 'block' : 'none'};">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  checkCurrentUser();
  fetchActivities();
});

