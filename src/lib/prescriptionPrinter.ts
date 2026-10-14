export interface PrintPrescriptionData {
  rx: any;
  patient: any;
  doctor: any;
}

export function printPrescription({ rx, patient, doctor }: PrintPrescriptionData) {
  const patientUser = patient?.user || {};
  const doctorUser = doctor || {};
  const clinic = doctorUser?.doctor?.clinic || {};

  const doctorName = doctorUser?.name ? `Dr. ${doctorUser.name}` : 'Attending Ophthalmologist';
  const specialization = doctorUser?.doctor?.specialization || 'Ophthalmologist / Eye Specialist';
  const clinicName = clinic?.name || 'Ophthalmology Specialty Clinic';
  const clinicAddress = clinic?.address || '';
  const clinicPhone = clinic?.phone || doctorUser?.phone || '';
  const doctorCode = doctorUser?.doctor?.doctorCode ? `Doctor ID: ${doctorUser.doctor.doctorCode}` : '';

  const patientName = patientUser?.name || patient?.name || 'Patient';
  const patientAge = patient?.age ? `${patient.age} Years` : 'N/A';
  const patientGender = patient?.gender ? patient.gender.toUpperCase() : 'N/A';
  const patientPhone = patientUser?.phone || patient?.phone || '';

  const issuedDate = rx?.createdAt
    ? new Date(rx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const medicationsRows = (rx?.medications || [])
    .map((med: any, index: number) => {
      const eyeSideBadge = med.eyeSide
        ? `<span class="eye-badge">${med.eyeSide.toUpperCase()} EYE</span>`
        : '';
      const times = med.scheduleTimes?.length
        ? `<div class="med-times">Times: ${med.scheduleTimes.join(', ')}</div>`
        : '';
      const instructions = med.instructions
        ? `<div class="med-instructions">"${med.instructions}"</div>`
        : '';

      return `
        <tr>
          <td style="width: 35px; text-align: center; font-weight: 800;">${index + 1}</td>
          <td>
            <div class="med-name">${med.name} ${eyeSideBadge}</div>
            <div class="med-meta">${med.dosage || ''} • ${med.type || 'Medication'}</div>
            ${instructions}
          </td>
          <td style="width: 140px;">
            <div class="frequency">${med.frequency || 1}x ${med.frequencyUnit || 'daily'}</div>
            ${times}
          </td>
          <td style="width: 90px; text-align: center; font-weight: 700;">
            ${med.duration ? `${med.duration} Days` : 'As Directed'}
          </td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Prescription - ${patientName}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 15mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 16px;
          background: #fff;
          font-size: 13px;
          line-height: 1.4;
        }
        .rx-card {
          border: 2px solid #1e3a8a;
          border-radius: 16px;
          padding: 24px 28px;
          position: relative;
          min-height: 94vh;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #1e3a8a;
          padding-bottom: 16px;
          margin-bottom: 16px;
        }
        .doc-title {
          font-size: 22px;
          font-weight: 900;
          color: #1e3a8a;
          margin: 0 0 4px 0;
          letter-spacing: -0.5px;
        }
        .doc-spec {
          font-size: 13px;
          font-weight: 700;
          color: #0284c7;
          margin: 0 0 4px 0;
        }
        .doc-meta {
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
          margin: 0;
        }
        .clinic-box {
          text-align: right;
          max-width: 260px;
        }
        .clinic-name {
          font-size: 16px;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 4px 0;
        }
        .clinic-meta {
          font-size: 11px;
          color: #64748b;
          margin: 2px 0;
        }
        .patient-banner {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 18px;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr;
          gap: 12px;
          margin-bottom: 18px;
        }
        .patient-field-label {
          font-size: 9px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        .patient-field-val {
          font-size: 13px;
          font-weight: 800;
          color: #1e293b;
        }
        .diagnosis-section {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          border-radius: 6px;
          padding: 10px 14px;
          margin-bottom: 20px;
        }
        .diagnosis-title {
          font-size: 10px;
          font-weight: 900;
          color: #2563eb;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        .diagnosis-text {
          font-size: 14px;
          font-weight: 800;
          color: #1e3a8a;
          margin: 0;
        }
        .rx-symbol {
          font-family: Georgia, serif;
          font-size: 36px;
          font-weight: 900;
          color: #1e3a8a;
          line-height: 1;
          margin-bottom: 8px;
        }
        .med-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .med-table th {
          background: #f1f5f9;
          color: #475569;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 8px 10px;
          border-top: 1px solid #cbd5e1;
          border-bottom: 2px solid #cbd5e1;
          text-align: left;
        }
        .med-table td {
          padding: 10px;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: top;
        }
        .med-name {
          font-size: 14px;
          font-weight: 900;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .eye-badge {
          display: inline-block;
          background: #ea580c;
          color: #fff;
          font-size: 9px;
          font-weight: 900;
          padding: 2px 6px;
          border-radius: 6px;
          letter-spacing: 0.5px;
        }
        .med-meta {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          margin-top: 2px;
        }
        .med-instructions {
          font-size: 11px;
          color: #059669;
          font-style: italic;
          margin-top: 4px;
          font-weight: 600;
        }
        .frequency {
          font-size: 12px;
          font-weight: 800;
          color: #1e293b;
        }
        .med-times {
          font-size: 10px;
          color: #64748b;
          font-weight: 600;
          margin-top: 2px;
        }
        .clinical-notes {
          background: #fafafa;
          border: 1px dashed #cbd5e1;
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 24px;
        }
        .notes-label {
          font-size: 9px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .notes-content {
          font-size: 12px;
          color: #334155;
          font-style: italic;
          margin: 0;
        }
        .footer {
          border-top: 1px solid #e2e8f0;
          padding-top: 16px;
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .brand-footer {
          font-size: 10px;
          color: #94a3b8;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        .signature-box {
          text-align: center;
          width: 200px;
        }
        .signature-line {
          border-bottom: 1px dashed #475569;
          height: 40px;
          margin-bottom: 6px;
        }
        .signature-label {
          font-size: 11px;
          font-weight: 800;
          color: #334155;
        }
      </style>
    </head>
    <body>
      <div class="rx-card">
        <div>
          <!-- Header -->
          <div class="header">
            <div>
              <h1 class="doc-title">${doctorName}</h1>
              <p class="doc-spec">${specialization}</p>
              <p class="doc-meta">${doctorCode}</p>
            </div>
            <div class="clinic-box">
              <h2 class="clinic-name">${clinicName}</h2>
              ${clinicAddress ? `<p class="clinic-meta">${clinicAddress}</p>` : ''}
              ${clinicPhone ? `<p class="clinic-meta">Tel: ${clinicPhone}</p>` : ''}
            </div>
          </div>

          <!-- Patient Information -->
          <div class="patient-banner">
            <div>
              <div class="patient-field-label">Patient Full Name</div>
              <div class="patient-field-val">${patientName}</div>
            </div>
            <div>
              <div class="patient-field-label">Age</div>
              <div class="patient-field-val">${patientAge}</div>
            </div>
            <div>
              <div class="patient-field-label">Gender</div>
              <div class="patient-field-val">${patientGender}</div>
            </div>
            <div>
              <div class="patient-field-label">Date Issued</div>
              <div class="patient-field-val">${issuedDate}</div>
            </div>
          </div>

          <!-- Diagnosis -->
          ${
            rx?.diagnosis
              ? `
            <div class="diagnosis-section">
              <div class="diagnosis-title">Clinical Diagnosis</div>
              <p class="diagnosis-text">${rx.diagnosis}</p>
            </div>
          `
              : ''
          }

          <!-- Rx Symbol -->
          <div class="rx-symbol">℞</div>

          <!-- Medications List -->
          <table class="med-table">
            <thead>
              <tr>
                <th style="text-align: center;">#</th>
                <th>Medication & Regimen</th>
                <th>Frequency & Time</th>
                <th style="text-align: center;">Duration</th>
              </tr>
            </thead>
            <tbody>
              ${medicationsRows}
            </tbody>
          </table>

          <!-- Clinical Notes if available -->
          ${
            rx?.notes
              ? `
            <div class="clinical-notes">
              <div class="notes-label">Doctor's Clinical Advice</div>
              <p class="notes-content">"${rx.notes}"</p>
            </div>
          `
              : ''
          }
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="brand-footer">
            Noor Einek Tele-Ophthalmology Portal • Powered by Pharco
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Doctor Signature & Stamp</div>
          </div>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=850,height=900');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
