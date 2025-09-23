import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../AdminLayout";
import "./SendEmail.css";

const SendEmail = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dragActive, setDragActive] = useState(false);
  
  // Predefined email addresses
  const predefinedEmails = {
    admin: [
      "cjtmadmhealx@gmail.com"
    ],
    doctor: [
      "doctorgsdhealx@gmail.com",
    ]
  };
  
  // Form data - FIXED: Initialize recipients with admin emails since recipientType defaults to "admin"
  const [emailData, setEmailData] = useState({
    recipients: ["cjtmadmhealx@gmail.com"], // Initialize with admin emails
    recipientType: "admin",
    customEmails: "",
    subject: "",
    message: "",
    priority: "normal"
  });
  
  // File handling
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [emailPreview, setEmailPreview] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const adminData = localStorage.getItem("admin");
    if (adminData) {
      setAdmin(JSON.parse(adminData));
    }
    
    // Set default subject based on current date
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    setEmailData(prev => ({
      ...prev,
      subject: `📊 Financial Reports - ${today} | HealX Healthcare`,
      message: `Dear Team,

Please find attached the financial reports for your review. These reports contain important financial data and insights for the healthcare management system.

Report Details:
• Generated on: ${today}
• Report Type: Financial Analysis
• Period: Current Period
• System: HealX Healthcare Management

Please review the attached documents and let us know if you need any clarification or have questions regarding the financial data.

Best regards,
Financial Management Team
HealX Healthcare Center`
    }));
  }, []);

  // Handle page refresh
  const handleRefresh = () => {
    window.location.reload();
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files) => {
    const pdfFiles = files.filter(file => file.type === "application/pdf");
    
    if (pdfFiles.length === 0) {
      setError("Please upload only PDF files");
      return;
    }

    // Check file size (max 10MB per file)
    const oversizedFiles = pdfFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`Files too large: ${oversizedFiles.map(f => f.name).join(", ")}. Max size: 10MB per file`);
      return;
    }

    // Add files to attached list
    const newFiles = pdfFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type
    }));

    setAttachedFiles(prev => [...prev, ...newFiles]);
    setError("");
    setSuccess(`Successfully added ${pdfFiles.length} PDF file(s)`);
    setTimeout(() => setSuccess(""), 3000);
  };

  const removeFile = (fileId) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Handle recipient type change - FIXED: Properly populate recipients array
  const handleRecipientTypeChange = (type) => {
    setEmailData(prev => ({
      ...prev,
      recipientType: type,
      recipients: type === "custom" ? [] : predefinedEmails[type] || [],
      customEmails: ""
    }));
  };

  // Handle custom emails input
  const handleCustomEmailsChange = (value) => {
    setEmailData(prev => ({
      ...prev,
      customEmails: value,
      recipients: value.split(",").map(email => email.trim()).filter(email => email)
    }));
  };

  // Validate email format
  const validateEmails = (emails) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emails.every(email => emailRegex.test(email));
  };

  // Send email function
  const sendEmail = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Validation
      if (emailData.recipients.length === 0) {
        throw new Error("Please select recipients or enter email addresses");
      }

      if (!validateEmails(emailData.recipients)) {
        throw new Error("Please enter valid email addresses");
      }

      if (!emailData.subject.trim()) {
        throw new Error("Please enter an email subject");
      }

      if (!emailData.message.trim()) {
        throw new Error("Please enter an email message");
      }

      if (attachedFiles.length === 0) {
        throw new Error("Please attach at least one financial report PDF");
      }

      // Prepare form data for file upload
      const formData = new FormData();
      
      // Add email data
      formData.append('recipients', JSON.stringify(emailData.recipients));
      formData.append('subject', emailData.subject);
      formData.append('message', emailData.message);
      formData.append('priority', emailData.priority);
      formData.append('emailType', 'financial_reports');
      
      // Add files
      attachedFiles.forEach((fileObj, index) => {
        formData.append(`attachment_${index}`, fileObj.file);
      });
      
      formData.append('attachmentCount', attachedFiles.length.toString());

      // Send to backend API
      const response = await fetch("http://localhost:7000/api/emails/send-financial-reports", {
        method: "POST",
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to send email");
      }

      // Success
      setSuccess(`✅ Email sent successfully to ${emailData.recipients.length} recipient(s)!`);
      
      // Clear form
      setAttachedFiles([]);
      setEmailData(prev => ({
        ...prev,
        subject: prev.subject.replace(/📊 Financial Reports.*/, `📊 Financial Reports - ${new Date().toLocaleDateString()} | HealX Healthcare`),
        customEmails: ""
      }));

      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000);

    } catch (error) {
      console.error("Error sending email:", error);
      setError(error.message || "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout admin={admin} title="Send Financial Reports">
      <div className="send-email-container">
        <div className="se-header">
          <h1>📧 Send Financial Reports</h1>
          <p>Send financial PDF reports to admin and medical staff</p>
          <div className="se-header-buttons">
            <button 
              className="se-back-btn" 
              onClick={() => navigate(-1)}
            >
              ← Back to Dashboard
            </button>
            <button 
              className="se-refresh-btn" 
              onClick={handleRefresh}
            >
              🔄 Refresh Page
            </button>
          </div>
        </div>

        {error && (
          <div className="se-error-banner">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="se-success-banner">
            {success}
          </div>
        )}

        <div className="se-main-content">
          {/* Recipients Section */}
          <div className="se-section">
            <h2>👥 Select Recipients</h2>
            
            <div className="se-recipient-types">
              <label className="se-radio-option">
                <input
                  type="radio"
                  name="recipientType"
                  value="admin"
                  checked={emailData.recipientType === "admin"}
                  onChange={(e) => handleRecipientTypeChange(e.target.value)}
                />
                <div className="se-radio-content">
                  <strong>👨‍💼 Admin Team</strong>
                  <small>Financial administrators and management</small>
                  <div className="se-email-preview">
                    {predefinedEmails.admin.map(email => (
                      <span key={email} className="se-email-chip">{email}</span>
                    ))}
                  </div>
                </div>
              </label>

              <label className="se-radio-option">
                <input
                  type="radio"
                  name="recipientType"
                  value="doctor"
                  checked={emailData.recipientType === "doctor"}
                  onChange={(e) => handleRecipientTypeChange(e.target.value)}
                />
                <div className="se-radio-content">
                  <strong>👨‍⚕️ Medical Team</strong>
                  <small>Doctors and medical directors</small>
                  <div className="se-email-preview">
                    {predefinedEmails.doctor.map(email => (
                      <span key={email} className="se-email-chip">{email}</span>
                    ))}
                  </div>
                </div>
              </label>

              <label className="se-radio-option">
                <input
                  type="radio"
                  name="recipientType"
                  value="custom"
                  checked={emailData.recipientType === "custom"}
                  onChange={(e) => handleRecipientTypeChange(e.target.value)}
                />
                <div className="se-radio-content">
                  <strong>✉️ Custom Recipients</strong>
                  <small>Enter specific email addresses</small>
                </div>
              </label>
            </div>

            {emailData.recipientType === "custom" && (
              <div className="se-custom-emails">
                <label>Enter email addresses (comma-separated):</label>
                <textarea
                  placeholder="admin@hospital.com, doctor@hospital.com, manager@hospital.com"
                  value={emailData.customEmails}
                  onChange={(e) => handleCustomEmailsChange(e.target.value)}
                  rows="3"
                />
                {emailData.recipients.length > 0 && (
                  <div className="se-email-preview">
                    {emailData.recipients.map((email, index) => (
                      <span key={index} className="se-email-chip">{email}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Email Content Section */}
          <div className="se-section">
            <h2>📝 Email Content</h2>
            
            <div className="se-form-group">
              <label>Priority Level:</label>
              <select
                value={emailData.priority}
                onChange={(e) => setEmailData(prev => ({ ...prev, priority: e.target.value }))}
              >
                <option value="normal">📄 Normal Priority</option>
                <option value="high">⚠️ High Priority</option>
                <option value="urgent">🚨 Urgent</option>
              </select>
            </div>

            <div className="se-form-group">
              <label>Email Subject:</label>
              <input
                type="text"
                value={emailData.subject}
                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter email subject"
              />
            </div>

            <div className="se-form-group">
              <label>Message:</label>
              <textarea
                value={emailData.message}
                onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Enter your message here..."
                rows="8"
              />
            </div>
          </div>

          {/* File Upload Section */}
          <div className="se-section">
            <h2>📎 Attach Financial Reports</h2>
            
            <div
              className={`se-file-drop-zone ${dragActive ? "se-drag-active" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input").click()}
            >
              <div className="se-drop-content">
                <div className="se-drop-icon">📁</div>
                <div className="se-drop-text">
                  <strong>Drag & Drop PDF Reports Here</strong>
                  <p>or click to browse files</p>
                  <small>Only PDF files accepted • Max 10MB per file</small>
                </div>
              </div>
              
              <input
                id="file-input"
                type="file"
                multiple
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
            </div>

            {/* Attached Files List */}
            {attachedFiles.length > 0 && (
              <div className="se-attached-files">
                <h3>📎 Attached Reports ({attachedFiles.length})</h3>
                {attachedFiles.map((fileObj) => (
                  <div key={fileObj.id} className="se-file-item">
                    <div className="se-file-icon">📄</div>
                    <div className="se-file-info">
                      <div className="se-file-name">{fileObj.name}</div>
                      <div className="se-file-size">{formatFileSize(fileObj.size)}</div>
                    </div>
                    <button
                      className="se-file-remove"
                      onClick={() => removeFile(fileObj.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview Section */}
          {emailData.recipients.length > 0 && emailData.subject && (
            <div className="se-section se-preview-section">
              <h2>👁️ Email Preview</h2>
              <div className="se-email-preview-card">
                <div className="se-preview-header">
                  <div><strong>To:</strong> {emailData.recipients.join(", ")}</div>
                  <div><strong>Subject:</strong> {emailData.subject}</div>
                  <div><strong>Priority:</strong> {emailData.priority.toUpperCase()}</div>
                  {attachedFiles.length > 0 && (
                    <div><strong>Attachments:</strong> {attachedFiles.length} PDF file(s)</div>
                  )}
                </div>
                <div className="se-preview-body">
                  <div className="se-message-preview">
                    {emailData.message.split("\n").map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Send Button */}
          <div className="se-send-section">
            <button
              className="se-send-button"
              onClick={sendEmail}
              disabled={loading || emailData.recipients.length === 0 || attachedFiles.length === 0}
            >
              {loading ? (
                <>
                  <div className="se-loading-spinner"></div>
                  Sending Email...
                </>
              ) : (
                <>
                  📧 Send Financial Reports
                </>
              )}
            </button>
            
            {attachedFiles.length === 0 && (
              <p className="se-send-help">Please attach at least one PDF report to send</p>
            )}
            
            {emailData.recipients.length === 0 && (
              <p className="se-send-help">Please select recipients to send email</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SendEmail;
