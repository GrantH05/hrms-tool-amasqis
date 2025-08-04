import React from "react";
import { DatePicker, Select } from "antd";
import CommonSelect from "../../core/common/commonSelect";
import { termination } from "../../core/common/selectoption/selectoption";
import dayjs from "dayjs";

interface Props {
  formData: any;
  onChange: (key: string, value: any) => void;
  onSubmit: () => void;
  onClose: () => void;
  employees: any[];
  submitStatus: string | null;
  visible: boolean;
}

const EditResignationModal: React.FC<Props> = ({
  visible,
  formData,
  onChange,
  onSubmit,
  onClose,
  employees,
  submitStatus,
}) => {
  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement || document.body;
  };

  return (
    <div className={`modal fade ${visible ? "show d-block" : ""}`} id="edit_resignation" role="dialog">
      <div className="modal-dialog modal-dialog-centered modal-md">
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">Edit Resignation</h4>
            <button
              type="button"
              className="btn-close custom-btn-close"
              onClick={onClose}
              aria-label="Close"
            >
              <i className="ti ti-x" />
            </button>
          </div>

          <div className="modal-body pb-0">
            <div className="row">
              <div className="col-md-12">
                <div className="mb-3">
                  <label className="form-label">Employee</label>
                  <Select
                    disabled
                    value={formData.employeeId || null}
                    style={{ width: "100%" }}
                    options={employees.map((emp: any) => ({
                      label: `${emp.firstName} ${emp.lastName}`,
                      value: emp._id,
                    }))}
                  />
                </div>
              </div>
              <div className="col-md-12">
                <div className="mb-3">
                  <label className="form-label">Type</label>
                  <CommonSelect
                    options={termination}
                    value={formData.type}
                    onChange={(val: any) => onChange("type", val)}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Notice Date</label>
                  <div className="input-icon-end position-relative">
                    <DatePicker
                      className="form-control datetimepicker"
                      format={{ format: "DD-MM-YYYY", type: "mask" }}
                      getPopupContainer={getModalContainer}
                      value={formData.noticeDate ? dayjs(formData.noticeDate) : null}
                      onChange={(_, dateStr) => onChange("noticeDate", dateStr)}
                      placeholder="DD-MM-YYYY"
                    />
                    <span className="input-icon-addon">
                      <i className="ti ti-calendar text-gray-7" />
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Resignation Date</label>
                  <div className="input-icon-end position-relative">
                    <DatePicker
                      className="form-control datetimepicker"
                      format={{ format: "DD-MM-YYYY", type: "mask" }}
                      getPopupContainer={getModalContainer}
                      value={formData.resignationDate ? dayjs(formData.resignationDate) : null}
                      onChange={(_, dateStr) => onChange("resignationDate", dateStr)}
                      placeholder="DD-MM-YYYY"
                    />
                    <span className="input-icon-addon">
                      <i className="ti ti-calendar text-gray-7" />
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-md-12">
                <div className="mb-3">
                  <label className="form-label">Reason</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData.reason}
                    onChange={(e) => onChange("reason", e.target.value)}
                  />
                </div>
              </div>
              {submitStatus === "success" && (
                <div className="alert alert-success">Resignation updated!</div>
              )}
              {submitStatus === "error" && (
                <div className="alert alert-danger">Failed to update resignation.</div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-light me-2" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={onSubmit}>Update</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditResignationModal;
