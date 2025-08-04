import React from "react";

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  employeeName?: string;
  status?: string | null;
}

const DeleteResignationModal: React.FC<Props> = ({
  visible,
  onClose,
  onConfirm,
  employeeName,
  status,
}) => {
  return (
    <div className={`modal fade ${visible ? "show d-block" : ""}`} id="delete_resignation" role="dialog">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">Confirm Deletion</h4>
            <button
              type="button"
              className="btn-close custom-btn-close"
              onClick={onClose}
              aria-label="Close"
            >
              <i className="ti ti-x" />
            </button>
          </div>
          <div className="modal-body">
            <p>
              Are you sure you want to delete the resignation
              {employeeName ? ` for ${employeeName}` : ""}?
            </p>
            {status === "success" && <div className="alert alert-success">Deleted successfully.</div>}
            {status === "error" && <div className="alert alert-danger">Failed to delete resignation.</div>}
          </div>
          <div className="modal-footer">
            <button className="btn btn-light me-2" onClick={onClose}>Cancel</button>
            <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteResignationModal;