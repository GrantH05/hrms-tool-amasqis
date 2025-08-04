import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Table from "../../core/common/dataTable/index";
import { all_routes } from "../router/all_routes";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import CollapseHeader from "../../core/common/collapse-header/collapse-header";
import { useSocket } from "../../../SocketContext";
import { Socket } from "socket.io-client";
import ResignationModals from "../../../core/modals/resignationModal";
import EditResignationModal from "../../../core/modals/editResignationModal";
import DeleteResignationModal from "../../../core/modals/deleteResignationModal";

const Resignation = () => {
  const socket = useSocket() as Socket | null;
  const [resignations, setResignations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [employees, setEmployees] = useState<any[]>([]);

  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const [form, setForm] = useState<any>({
    employeeId: null,
    type: "Resigned",
    noticeDate: null,
    resignationDate: null,
    reason: "",
  });

  const [editForm, setEditForm] = useState<any>(null);
  const [selectedResignation, setSelectedResignation] = useState<any>(null);

  useEffect(() => {
    if (!socket) return;

    setLoading(true);
    socket.emit("hr/resignation/list", {});
    socket.emit("hr/employees/list", {});

    const handleListResponse = (response: any) => {
      if (response.done) {
        setResignations(response.data);
        setError(null);
      } else {
        setError(response.error || "Failed to load data");
      }
      setLoading(false);
    };

    const handleEmployeeList = (res: any) => {
      if (res.done) setEmployees(res.data);
    };

    const handleAddResponse = (res: any) => {
      if (res.done) {
        setSubmitStatus("success");
        socket.emit("hr/resignation/list", {});
        setAddModalVisible(false);
        resetForm();
      } else {
        setSubmitStatus("error");
      }
    };

    const handleEditResponse = (res: any) => {
      if (res.done) {
        setSubmitStatus("success");
        socket.emit("hr/resignation/list", {});
        setEditModalVisible(false);
        setEditForm(null);
      } else {
        setSubmitStatus("error");
      }
    };

    const handleDeleteResponse = (res: any) => {
      if (res.done) {
        setDeleteStatus("success");
        socket.emit("hr/resignation/list", {});
        setDeleteModalVisible(false);
        setSelectedResignation(null);
      } else {
        setDeleteStatus("error");
      }
    };

    socket.on("hr/resignation/list-response", handleListResponse);
    socket.on("hr/resignation/add-response", handleAddResponse);
    socket.on("hr/resignation/edit-response", handleEditResponse);
    socket.on("hr/resignation/delete-response", handleDeleteResponse);
    socket.on("hr/employees/list-response", handleEmployeeList);

    return () => {
      socket.off("hr/resignation/list-response", handleListResponse);
      socket.off("hr/resignation/add-response", handleAddResponse);
      socket.off("hr/resignation/edit-response", handleEditResponse);
      socket.off("hr/resignation/delete-response", handleDeleteResponse);
      socket.off("hr/employees/list-response", handleEmployeeList);
    };
  }, [socket]);

  const resetForm = () => {
    setForm({ employeeId: null, type: "Resigned", noticeDate: null, resignationDate: null, reason: "" });
    setSubmitStatus(null);
  };

  const handleFormChange = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleEditFormChange = (key: string, value: any) => {
    setEditForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (!socket) return;
    const { employeeId, ...resignationData } = form;
    socket.emit("hr/resignation/add", { employeeId, resignationData });
  };

  const handleEdit = () => {
    if (!socket || !editForm || !editForm._id) return;
    const { _id, employeeId, ...resignationData } = editForm;
    socket.emit("hr/resignation/edit", { resignationId: _id, employeeId, resignationData });
  };

  const handleDelete = () => {
    if (!socket || !selectedResignation) return;
    socket.emit("hr/resignation/delete", { resignationId: selectedResignation._id });
  };

  const openEditModal = (record: any) => {
    setEditForm(record);
    setEditModalVisible(true);
  };

  const openDeleteModal = (record: any) => {
    setSelectedResignation(record);
    setDeleteModalVisible(true);
  };

  const columns = [
    {
      title: "Resigning Employee",
      dataIndex: "firstName",
      render: (_: any, record: any) => (
        <div className="d-flex align-items-center">
          <Link to={all_routes.resignation} className="avatar avatar-md me-2">
            <ImageWithBasePath
              src={record.avatar || "assets/img/users/default-avatar.png"}
              className="rounded-circle"
              alt="user"
            />
          </Link>
          <h6 className="fw-medium">
            <Link to={all_routes.resignation}>
              {record.firstName} {record.lastName}
            </Link>
          </h6>
        </div>
      ),
    },
    {
      title: "Department",
      dataIndex: "department",
    },
    {
      title: "Reason",
      dataIndex: "reason",
    },
    {
      title: "Notice Date",
      dataIndex: "noticeDate",
    },
    {
      title: "Resignation Date",
      dataIndex: "resignationDate",
    },
    {
      title: "Actions",
      render: (_: any, record: any) => (
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-primary" onClick={() => openEditModal(record)}>Edit</button>
          <button className="btn btn-sm btn-danger" onClick={() => openDeleteModal(record)}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Resignation</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={all_routes.adminDashboard}>
                    <i className="ti ti-smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item">Performance</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Resignation
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
            <div className="mb-2">
              <button
                onClick={() => setAddModalVisible(true)}
                className="btn btn-primary d-flex align-items-center"
              >
                <i className="ti ti-circle-plus me-2" />
                Add Resignation
              </button>
            </div>
            <div className="head-icons ms-2">
              <CollapseHeader />
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-sm-12">
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                <h5 className="d-flex align-items-center">Resignation List</h5>
              </div>
              <div className="card-body p-0">
                <Table dataSource={resignations} columns={columns} Selection={true} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ResignationModals
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSubmit={handleSubmit}
        formData={form}
        onChange={handleFormChange}
        employees={employees}
        submitStatus={submitStatus}
      />

      <EditResignationModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSubmit={handleEdit}
        formData={editForm}
        onChange={handleEditFormChange}
        employees={employees}
        submitStatus={submitStatus}
      />

      <DeleteResignationModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleDelete}
        employeeName={selectedResignation ? `${selectedResignation.firstName} ${selectedResignation.lastName}` : ""}
        status={deleteStatus}
      />

      <div className="footer d-sm-flex align-items-center justify-content-between bg-white border-top p-3">
        <p className="mb-0">2014 - 2025 © SmartHR.</p>
        <p>
          Designed & Developed By{" "}
          <Link to="#" className="text-primary">
            Dreams
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Resignation;
