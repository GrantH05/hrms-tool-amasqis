import React, { useEffect, useState } from "react";
import Select from "react-select";
import { DatePicker } from "antd";

// Example termination type options
const terminationTypeOptions = [
  { value: "standard", label: "Standard" },
  { value: "violation", label: "Violation" },
];

const TerminationModal = ({
  visible,
  mode,
  data,
  onOk,
  onCancel,
}) => {
  const [employeeId, setEmployeeId] = useState("");
  const [reason, setReason] = useState("");
  const [resignationDate, setResignationDate] = useState(null);
  const [terminationType, setTerminationType] = useState("standard");

  useEffect(() => {
    if (data && visible) {
      setEmployeeId(data.employeeId || "");
      setReason(data.reason || "");
      setResignationDate(data.resignationDate ? (typeof data.resignationDate === "string"
        ? (window.moment ? window.moment(data.resignationDate) : data.resignationDate)
        : data.resignationDate) : null);
      setTerminationType(data.terminationType || "standard");
    } else if (!visible) {
      setEmployeeId("");
      setReason("");
      setResignationDate(null);
      setTerminationType("standard");
    }
  }, [data, visible]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!employeeId || !reason || !resignationDate) return; // Basic validation
    onOk({
      employeeId,
      reason,
      resignationDate: resignationDate.format
        ? resignationDate.format("YYYY-MM-DD")
        : resignationDate,
      terminationType,
    });
  };

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (visible) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [visible]);

  // You can use Bootstrap modal classes here, or your own
  if (!visible) return null;

  return (
    <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.3)", zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">{mode === "edit" ? "Edit Termination" : "Add Termination"}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={onCancel} />
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label>Employee ID</label>
                <input
                  className="form-control"
                  value={employeeId}
                  disabled={mode === "edit"}
                  onChange={e => setEmployeeId(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label>Reason</label>
                <input
                  className="form-control"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label>Resignation Date</label><br />
                <DatePicker
                  value={resignationDate}
                  format="YYYY-MM-DD"
                  style={{ width: "100%" }}
                  onChange={setResignationDate}
                  getPopupContainer={() =>
                    document.getElementById("modal-datepicker") || document.body
                  }
                  required
                />
                <div id="modal-datepicker" /> {/* for DatePicker container */}
              </div>
              <div className="mb-3">
                <label>Termination Type</label>
                <Select
                  value={terminationTypeOptions.find(opt => opt.value === terminationType)}
                  onChange={opt => setTerminationType(opt.value)}
                  options={terminationTypeOptions}
                  menuPortalTarget={document.body}
                  styles={{ menuPortal: base => ({ ...base, zIndex: 2000 }) }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {mode === "edit" ? "Save" : "Add"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TerminationModal;
