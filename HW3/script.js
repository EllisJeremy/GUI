$(document).ready(function () {
  // Role management
  let currentRole = "application";

  // Role toggle functionality
  $("#application-role").on("click", function () {
    switchRole("application");
  });

  $("#manager-role").on("click", function () {
    switchRole("manager");
  });

  function switchRole(role) {
    if (role === "application") {
      $("#application-view").show();
      $("#manager-view").hide();
      $("#application-role").addClass("active");
      $("#manager-role").removeClass("active");
    } else {
      $("#application-view").hide();
      $("#manager-view").show();
      $("#manager-role").addClass("active");
      $("#application-role").removeClass("active");
      loadApplicants();
    }
  }

  // Application form submission
  $("#audition-form").on("submit", function (e) {
    e.preventDefault();
    const name = $("#name").val().trim();
    const email = $("#email").val().trim();
    const song = $("#song").val().trim();
    $.ajax({
      method: "POST",
      url: "/api/applicants",
      contentType: "application/json",
      data: JSON.stringify({ name, email, song }),
      success: function () {
        $("#form-success").fadeIn(300, function () {
          setTimeout(() => $("#form-success").fadeOut(300), 3500);
        });
        $("#audition-form")[0].reset();
      },
      error: function (xhr) {
        alert(xhr.responseJSON?.error || "Error submitting form.");
      },
    });
  });

  // Manager view functionality
  function loadApplicants() {
    $.ajax({
      method: "GET",
      url: "/api/applicants",
      success: function (data) {
        displayApplicants(data);
        lastApplicantCount = data.length; // used for the auto update feature below
      },
      error: function () {
        displayApplicants([]);
      },
    });
  }

  // checks every 3 seconds if there is new data to display
  setInterval(() => {
    if ($("#manager-view").is(":visible")) {
      $.get("/api/applicants", (data) => {
        if (data.length !== lastApplicantCount) {
          lastApplicantCount = data.length;
          displayApplicants(data);
        }
      });
    }
  }, 3000);

  function displayApplicants(applicants) {
    const tbody = $("#applicants-tbody");
    tbody.empty();
    applicants.forEach((a) => {
      const row = $(`
                <tr>
                    <td>${a.name}</td>
                    <td>${a.email}</td>
                    <td>${a.song}</td>
                    <td>${formatTimestamp(a.timestamp)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="edit-btn" data-id="${
                              a.id
                            }">Edit</button>
                            <button class="delete-btn" data-id="${
                              a.id
                            }">Delete</button>
                        </div>
                    </td>
                </tr>
            `);
      tbody.append(row);
    });
  }

  function formatTimestamp(timestamp) {
    if (!timestamp) return "N/A";

    try {
      const date = new Date(timestamp);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Invalid Date";
    }
  }

  // Edit button click handler (delegated event)
  $(document).on("click", ".edit-btn", function () {
    const id = $(this).data("id");
    editApplicant(id);
  });

  // Delete button click handler (delegated event)
  $(document).on("click", ".delete-btn", function () {
    const id = $(this).data("id");
    if (confirm("Are you sure you want to delete this applicant?")) {
      deleteApplicant(id);
    }
  });

  function editApplicant(id) {
    $.ajax({
      method: "GET",
      url: "/api/applicants",
      success: function (data) {
        const applicant = data.find((a) => a.id == id);
        if (!applicant) return alert("Applicant not found.");
        openModal(applicant);
      },
      error: function () {
        alert("Error loading applicant data.");
      },
    });
  }

  function deleteApplicant(id) {
    $.ajax({
      method: "DELETE",
      url: `/api/applicants/${id}`,
      success: function () {
        loadApplicants();
      },
      error: function (xhr) {
        alert(xhr.responseJSON?.error || "Error deleting applicant.");
      },
    });
  }

  function openModal(applicant) {
    $("#modal-title").text("Edit Applicant");
    $("#modal-id").val(applicant.id);
    $("#modal-name").val(applicant.name);
    $("#modal-email").val(applicant.email);
    $("#modal-song").val(applicant.song);
    $("#applicant-modal").show();
  }

  // Modal form submission (Edit only)
  $("#modal-form").on("submit", function (e) {
    e.preventDefault();
    const id = $("#modal-id").val();
    const name = $("#modal-name").val().trim();
    const email = $("#modal-email").val().trim();
    const song = $("#modal-song").val().trim();
    $.ajax({
      method: "PUT",
      url: `/api/applicants/${id}`,
      contentType: "application/json",
      data: JSON.stringify({ name, email, song }),
      success: function () {
        $("#applicant-modal").hide();
        loadApplicants();
      },
      error: function (xhr) {
        alert(xhr.responseJSON?.error || "Error updating applicant.");
      },
    });
  });

  // Modal close functionality
  $(".close, #modal-cancel").on("click", function () {
    $("#applicant-modal").hide();
  });

  // Close modal when clicking outside
  $(window).on("click", function (e) {
    const modal = $("#applicant-modal");
    if (e.target === modal[0]) {
      modal.hide();
    }
  });

  // Initialize with application view
  switchRole("application");
});
