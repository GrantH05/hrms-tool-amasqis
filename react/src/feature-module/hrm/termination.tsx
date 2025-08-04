import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Table from "../../core/common/dataTable/index";
import { all_routes } from "../router/all_routes";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import { termination, terminationtype } from "../../core/common/selectoption/selectoption";
import CommonSelect from "../../core/common/commonSelect";
import { DatePicker } from "antd";
import CollapseHeader from "../../core/common/collapse-header/collapse-header";
import { useSocket } from "../../../SocketContext";
import TerminationModal from "../../../core/modals/terminationModal";
import ConfirmModal from "../../../core/modals/confirmModal";

const sortFieldMap = {
  firstName: "firstName",
  email: "email",
  department: "department",
  resignationDate: "resignationDate",
  terminationType: "terminationType",
  status: "status",
};

const Termination = () => {
  const { socketState: socket } = useSocket();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sorting state
  const [sortBy, setSortBy] = useState("resignationDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modal and selection state
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [refreshFlag, setRefreshFlag] = useState(false);

  // Fetch termination list via socket; respects sorting
  const fetchTerminations = useCallback(() => {
    if (!socket) return;
    setLoading(true);
    setError(null);
    socket.emit("hr/termination/list", {
      sortBy,
      sortOrder,
    }, (res: any) => {
      if (res?.done) {
        setData(res.data || []);
        setLoading(false);
      } else {
        setData([]);
        setError(res?.error || "Unknown error");
        setLoading(false);
      }
    });
  }, [socket, sortBy, sortOrder]);

  // Effect: initial and on refresh/listen real-time
  useEffect(() => {
    if (!socket) return;
    fetchTerminations();
    socket.on("hr/termination/list-response", (res: any) => {
      if (res?.done) setData(res.data || []);
    });
    return () => {
      if (!socket) return;
      socket.off("hr/termination/list-response");
    };
  }, [socket, fetchTerminations, refreshFlag]);

  // Socket-based CRUD operations
  const handleAdd = (terminationData) => {
    if (!socket) return;
    socket.emit("hr/termination/add", { 
      employeeId: terminationData.employeeId, 
      terminationData 
    }, (res) => {
      if (res.done) setModalVisible(false);
      else setError(res.error || "Failed to add termination");
      setRefreshFlag(f => !f);
    });
  };

  const handleEdit = (employeeId, updateData) => {
    if (!socket) return;
    socket.emit("hr/termination/edit", { employeeId, updateData }, (res) => {
      if (res.done) setModalVisible(false);
      else setError(res.error || "Failed to update termination");
      setRefreshFlag(f => !f);
    });
  };

  const handleDelete = (employeeId) => {
    if (!socket) return;
    socket.emit("hr/termination/delete", { employeeId }, (res) => {
      setConfirmVisible(false);
      setSelected(null);
      if (!res.done) setError(res.error || "Failed to delete");
      setRefreshFlag(f => !f);
    });
  };

  // Sorting handler: triggered by AntD Table
  const onTableChange = (pagination, filters, sorter) => {
    const field = sortFieldMap[sorter.field] || "resignationDate";
    const order = sorter.order === "ascend" ? "asc" : "desc";
    setSortBy(field);
    setSortOrder(order);
  };

  // Table columns -- add Ant Design sorter for each sortable field
  const columns = [
    {
      title: "Resigning Employee",
      dataIndex: "firstName",
      sorter: true,
      sortOrder: sortBy === "firstName" ? (sortOrder === "asc" ? "ascend" : "descend") : false,
      render: (_: any, record: any) => (
        <>
          <span>{record.firstName} {record.lastName}</span>
        </>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      sorter: true,
      sortOrder: sortBy === "email" ? (sortOrder === "asc" ? "ascend" : "descend") : false,
    },
    {
      title: "Department",
      dataIndex: "department",
      sorter: true,
      sortOrder: sortBy === "department" ? (sortOrder === "asc" ? "ascend" : "descend") : false,
    },
    {
      title: "Resignation Date",
      dataIndex: "resignationDate",
      sorter: true,
      sortOrder: sortBy === "resignationDate" ? (sortOrder === "asc" ? "ascend" : "descend") : false,
      render: (val: string) => val ? new Date(val).toLocaleDateString() : "",
    },
    {
      title: "Type",
      dataIndex: "terminationType",
      sorter: true,
      sortOrder: sortBy === "terminationType" ? (sortOrder === "asc" ? "ascend" : "descend") : false,
    },
    {
      title: "Status",
      dataIndex: "status",
      sorter: true,
      sortOrder: sortBy === "status" ? (sortOrder === "asc" ? "ascend" : "descend") : false,
    },
    {
      title: "Actions",
      render: (_text: string, record: any) => (
        <>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => { setSelected(record); setModalMode("edit"); setModalVisible(true); }}>
            Edit
          </button>
          <button
            className="btn btn-sm btn-danger ms-2"
            onClick={() => { setSelected(record); setConfirmVisible(true); }}>
            Delete
          </button>
        </>
      ),
    },
  ];

  return (
    <div className="container-xxl">
      <CollapseHeader title="Termination Management" />
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <button
          className="btn btn-success"
          onClick={() => { setModalMode("add"); setSelected(null); setModalVisible(true); }}
        >
          Add Termination
        </button>
        {error && <span className="text-danger ms-3">{error}</span>}
      </div>
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="_id"
        pagination={false}
        onChange={onTableChange}
      />
      <TerminationModal
        visible={modalVisible}
        mode={modalMode}
        data={selected}
        onOk={modalMode === "add"
          ? handleAdd
          : (update) => handleEdit(selected?.employeeId || selected?._id, update)
        }
        onCancel={() => setModalVisible(false)}
      />
      <ConfirmModal
        visible={confirmVisible}
        title="Are you sure you want to delete this termination?"
        onOk={() => handleDelete(selected?.employeeId || selected?._id)}
        onCancel={() => setConfirmVisible(false)}
      />
      <footer className="mt-4 text-center">
        <div>2014 - 2025 © SmartHR.</div>
        <div>Designed &amp; Developed By Dreams</div>
      </footer>
    </div>
  );
};

export default Termination;
