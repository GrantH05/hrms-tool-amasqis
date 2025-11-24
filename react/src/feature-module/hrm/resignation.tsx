import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Table from "../../core/common/dataTable/index";
import { all_routes } from "../router/all_routes";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import CommonSelect from "../../core/common/commonSelect";
import { DatePicker } from "antd";
import CollapseHeader from "../../core/common/collapse-header/collapse-header";
import { useSocket } from "../../SocketContext";
import { Socket } from "socket.io-client";
import { format, parse } from "date-fns";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import dayjs from "dayjs";

type ResignationRow = {
  employeeName: string;
  department: string;
  reason: string;
  noticeDate: string;
  resignationDate: string; // already formatted by backend like "12 Sep 2025"
  resignationId: string;
};

type Stats = {
  totalResignations: string;
  recentResignations: string;
};

type DepartmentRow = {
  department: string;
}

type EmployeeRow = {
  employeeId: string;
  firstName: string;
  lastName: string;
};

const Resignation = () => {
  const socket = useSocket() as Socket | null;

  const [rows, setRows] = useState<ResignationRow[]>([]);
  const [rowsDepartments, setRowsDepartments] = useState<DepartmentRow[]>([]);
  const [rowsEmployee, setRowsEmployee] = useState<EmployeeRow[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalResignations: "0",
    recentResignations: "0",
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>("today");
  const [customRange, setCustomRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const [editing, setEditing] = useState<any>(null);

  // Controlled edit form data
  const [editForm, setEditForm] = useState({
    employeeName: "",
    department: "",
    noticeDate: "", // "DD-MM-YYYY" shown in modal
    reason: "",
    resignationDate: "", // "DD-MM-YYYY" shown in modal
    resignationId: "",
  });

  const ddmmyyyyToYMD = (s?: string) => {
    if (!s) return "";
    const d = parse(s, "dd-MM-yyyy", new Date());
    return isNaN(d.getTime()) ? "" : format(d, "yyyy-MM-dd");
  };

  const openEditModal = (row: any) => {
    setEditForm({
      employeeName: row.employeeName || "",
      department: row.department || "",
      noticeDate: row.noticeDate
        ? format(parse(row.noticeDate, "yyyy-MM-dd", new Date()), "dd-MM-yyyy")
        : "",
      reason: row.reason || "",
      resignationDate: row.resignationDate
        ? format(
            parse(row.resignationDate, "yyyy-MM-dd", new Date()),
            "dd-MM-yyyy"
          )
        : "",
      resignationId: row.resignationId,
    });
  };

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };

  const parseYMD = (s?: string) =>
    s ? parse(s, "yyyy-MM-dd", new Date()) : null; // string -> Date
  const toYMD = (d: any) => {
    if (!d) return "";
    const dt = "toDate" in d ? d.toDate() : d; // support dayjs or Date
    return format(dt, "yyyy-MM-dd");
  };

  // state near top of component
  const [addForm, setAddForm] = useState({
    employeeName: "",
    department: "",
    reason: "",
    noticeDate: "", // YYYY-MM-DD from DatePicker
    resignationDate: "",
  });

  const confirmDelete = (onConfirm: () => void) => {
    Modal.confirm({
      title: null,
      icon: null,
      closable: true,
      centered: true,
      okText: "Yes, Delete",
      cancelText: "Cancel",
      okButtonProps: {
        style: { background: "#ff4d4f", borderColor: "#ff4d4f" },
      },
      cancelButtonProps: { style: { background: "#f5f5f5" } },
      content: (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: "0 auto 12px",
              borderRadius: 12,
              background: "#ffecec",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <a aria-label="Delete">
              <DeleteOutlined style={{ fontSize: 18, color: "#ff4d4f" }} />
            </a>
          </div>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>
            Confirm Delete
          </div>
          <div style={{ color: "#6b7280" }}>
            You want to delete all the marked items, this can’t be undone once
            you delete.
          </div>
        </div>
      ),
      onOk: async () => {
        await onConfirm();
      },
    });
  };

  const fmtYMD = (s?: string) => {
    if (!s) return "";
    const d = parse(s, "yyyy-MM-dd", new Date());
    return isNaN(d.getTime()) ? s : format(d, "dd MMM yyyy");
  };

  // event handlers
  const onListResponse = useCallback((res: any) => {
    if (res?.done) {
      setRows(res.data || []);
    } else {
      setRows([]);
      // optionally toast error
      // toast.error(res?.message || "Failed to fetch resignations");
    }
    setLoading(false);
  }, []);

    const onEmployeeListResponse = useCallback ((res:any) => {
      if (res?.done) {
        setRowsEmployee(res.data || []);
      } else {
        setRowsEmployee([]);
      }
      setLoading(false);
    },[]);

  const onDepartmentsListResponse = useCallback((res: any) => {
    if (res?.done) {
      setRowsDepartments(res.data || []);
    } else {
      setRowsDepartments([]);
      // optionally toast error
      // toast.error(res?.message || "Failed to fetch resignations");
    }
    setLoading(false);
  }, []);

  const onStatsResponse = useCallback((res: any) => {
    if (res?.done && res.data) {
      setStats(res.data);
    }
  }, []);

  const onAddResponse = useCallback((res: any) => {
    // feedback only; list and stats will be broadcast from controller
    if (!res?.done) {
      // toast.error(res?.message || "Failed to add resignation");
    }
  }, []);

  const onUpdateResponse = useCallback((res: any) => {
    if (!res?.done) {
      // toast.error(res?.message || "Failed to update resignation");
    }
  }, []);

  const onDeleteResponse = useCallback((res: any) => {
    if (res?.done) {
      setSelectedKeys([]);
    } else {
      // toast.error(res?.message || "Failed to delete");
    }
  }, []);

  // register socket listeners and join room
  useEffect(() => {
    if (!socket) return;

    socket.emit("join-room", "hr_room");

    socket.on("hr/resignation/resignationlist-response", onListResponse);
    socket.on("hr/resignation/departmentlist-response", onDepartmentsListResponse);
    socket.on("hr/resignation/resignation-details-response", onStatsResponse);
    socket.on("hr/resignation/add-resignation-response", onAddResponse);
    socket.on("hr/resignation/update-resignation-response", onUpdateResponse);
    socket.on("hr/resignation/delete-resignation-response", onDeleteResponse);
    socket.on("hr/trainingList/get-employeeDetails-response", onEmployeeListResponse);

    return () => {
      socket.off("hr/resignation/resignationlist-response", onListResponse);
      socket.off("hr/resignation/departmentlist-response", onDepartmentsListResponse);
      socket.off(
        "hr/resignation/resignation-details-response",
        onStatsResponse
      );
      socket.off("hr/resignation/add-resignation-response", onAddResponse);
      socket.off(
        "hr/resignation/update-resignation-response",
        onUpdateResponse
      );
      socket.off(
        "hr/resignation/delete-resignation-response",
        onDeleteResponse
      );
      socket.off("hr/trainingList/get-employeeDetails-response", onEmployeeListResponse);
    };
  }, [
    socket,
    onListResponse,
    onDepartmentsListResponse,
    onStatsResponse,
    onAddResponse,
    onUpdateResponse,
    onDeleteResponse,
    onEmployeeListResponse,
  ]);

  // fetchers
  const fetchList = useCallback(
    (type: string, range?: { startDate?: string; endDate?: string }) => {
      if (!socket) return;
      setLoading(true);
      const payload: any = { type };
      if (type === "custom" && range?.startDate && range?.endDate) {
        payload.startDate = range.startDate;
        payload.endDate = range.endDate;
      }
      socket.emit("hr/resignation/resignationlist", payload);
    },
    [socket]
  );

    const fetchDepartmentsList = useCallback(() => {
        if (!socket) return;
        setLoading(true);
        socket.emit("hr/resignation/departmentlist");
      },
      [socket]
    );

    const fetchEmployeeList = useCallback(() => {
        if (!socket) return;
        setLoading(true);
        socket.emit("hr/trainingList/get-employeeDetails");
      },
      [socket]
    );

  const toIsoFromDDMMYYYY = (s: string) => {
    // s like "13-09-2025"
    const [dd, mm, yyyy] = s.split("-").map(Number);
    if (!dd || !mm || !yyyy) return null;
    // Construct UTC date to avoid TZ shifts
    const d = new Date(Date.UTC(yyyy, mm - 1, dd, 0, 0, 0));
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const handleAddSave = () => {
    if (!socket) return;

    // basic validation
    if (
      !addForm.employeeName ||
      !addForm.noticeDate ||
      !addForm.reason ||
      !addForm.resignationDate ||
      !addForm.department
    ) {
      // toast.warn("Please fill required fields");
      return;
    }

    const noticeIso = toIsoFromDDMMYYYY(addForm.noticeDate);
    if (!noticeIso) {
      // toast.error("Invalid notice date");
      return;
    }
    const resIso = toIsoFromDDMMYYYY(addForm.resignationDate);
    if (!resIso) return;

    const payload = {
      employeeName: addForm.employeeName,
      noticeDate: noticeIso,
      reason: addForm.reason,
      department: addForm.department,
      resignationDate: resIso,
    };

    socket.emit("hr/resignation/add-resignation", payload);
    // modal has data-bs-dismiss; optional: reset form
    setAddForm({
      employeeName: "",
      department: "",
      reason: "",
      noticeDate: "", // YYYY-MM-DD from DatePicker
      resignationDate: "",
    });
    socket.emit("hr/resignation/resignationlist", { type: "today" });
    socket.emit("hr/resignation/resignation-details");
  };

  const handleEditSave = () => {
    if (!socket) return;

    // basic validation
    if (
      !editForm.employeeName ||
      !editForm.noticeDate ||
      !editForm.reason ||
      !editForm.department ||
      !editForm.resignationDate
    ) {
      // toast.warn("Please fill required fields");
      return;
    }

    const noticeIso = toIsoFromDDMMYYYY(editForm.noticeDate);
    if (!noticeIso) {
      // toast.error("Invalid notice date");
      return;
    }
    const resIso = toIsoFromDDMMYYYY(editForm.resignationDate);
    if (!resIso) return;

    const payload = {
      employeeName: editForm.employeeName,
      noticeDate: noticeIso,
      reason: editForm.reason,
      department: editForm.department,
      resignationDate: resIso,
      resignationId: editForm.resignationId,
    };

    socket.emit("hr/resignation/update-resignation", payload);
    // modal has data-bs-dismiss; optional: reset form
    setEditForm({
      employeeName: "",
      department: "",
      reason: "",
      noticeDate: "", // YYYY-MM-DD from DatePicker
      resignationDate: "",
      resignationId: "",
    });
    socket.emit("hr/resignation/resignationlist", { type: "today" });
    socket.emit("hr/resignation/resignation-details");
  };

  const fetchStats = useCallback(() => {
    if (!socket) return;
    socket.emit("hr/resignation/resignation-details");
  }, [socket]);

  // initial + reactive fetch
  useEffect(() => {
    if (!socket) return;
    fetchList(filterType, customRange);
    fetchDepartmentsList();
    fetchStats();
    fetchEmployeeList();
  }, [socket, fetchList, fetchDepartmentsList, fetchEmployeeList, fetchStats, filterType, customRange]);

  // ui events
  type Option = { value: string; label: string };
  const handleFilterChange = (opt: Option | null) => {
    const value = opt?.value ?? "today";
    setFilterType(value);
    if (value !== "custom") {
      setCustomRange({});
      fetchList(value);
    }
  };

  const handleCustomRange = (_: any, dateStrings: [string, string]) => {
    if (dateStrings && dateStrings[0] && dateStrings[1]) {
      const range = { startDate: dateStrings[0], endDate: dateStrings[1] };
      setCustomRange(range);
      fetchList("custom", range);
    }
  };

  const handleBulkDelete = () => {
    if (!socket || selectedKeys.length === 0) return;
    if (
      window.confirm(
        `Delete ${selectedKeys.length} record(s)? This cannot be undone.`
      )
    ) {
      socket.emit("hr/resignation/delete-resignation", selectedKeys);
    }
  };

    type OptionEmployee = { value: string; label: string };

    const trainingEmployeeOptions: OptionEmployee[] = (rowsEmployee as any[]).map((t: any) => ({
      value: t.employeeId,
      label: t.firstName+" "+t.lastName+ " - "+t.employeeId,
    }));

  const handleSelectionChange = (keys: React.Key[]) => {
    setSelectedKeys(keys as string[]);
  };

  type OptionDepartments = { value: string; label: string };

    const departmentsOptions: OptionDepartments[] = (rowsDepartments as any[]).map((t: any) => ({
      value: t.department,
      label: t.department,
    }));

    // Helper to find option object from string value
    const toOption = (val: string | undefined) =>
      val ? departmentsOptions.find(o => o.value === val) : undefined;

    const empNameById = React.useMemo(() => {
      const m = new Map<string, string>();
      rowsEmployee.forEach(e => {
        const name = [e.firstName, e.lastName].filter(Boolean).join(" ");
        m.set(e.employeeId, name || e.employeeId);
      });
      return m;
    }, [rowsEmployee]);


  // table columns (preserved look, wired to backend fields)
  const columns: any[] = [
    {
      title: "Resigning Employee",
      dataIndex: "employeeName",
      render: (empId: string) => empNameById.get(empId) || empId,
      sorter: (a: ResignationRow, b: ResignationRow) => {
        const nameA = empNameById.get(a.employeeName) || a.employeeName;
        const nameB = empNameById.get(b.employeeName) || b.employeeName;
        return nameA.localeCompare(nameB);
      },
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
      render: (val: string) => fmtYMD(val),
      sorter: (a: ResignationRow, b: ResignationRow) =>
        new Date(a.noticeDate).getTime() - new Date(b.noticeDate).getTime(),
    },
    {
      title: "Resignation Date",
      dataIndex: "resignationDate",
      render: (val: string) => fmtYMD(val),
      sorter: (a: ResignationRow, b: ResignationRow) =>
        new Date(a.resignationDate).getTime() -
        new Date(b.resignationDate).getTime(),
    },
    {
      title: "               ",
      dataIndex: "resignationId", // must match your row field
      render: (id: string, record: ResignationRow) => (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a
            href="#"
            data-bs-toggle="modal"
            data-bs-target="#edit_resignation"
            onClick={(e) => {
              // still prefill the form before Bootstrap opens it
              openEditModal(record);
            }}
          >
            <i className="ti ti-edit" />
          </a>
          <a
            aria-label="Delete"
            onClick={(e) => {
              e.preventDefault();
              confirmDelete(() =>
                socket?.emit("hr/resignation/delete-resignation", [id])
              );
            }}
          >
            <i className="ti ti-trash" />
          </a>
        </div>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedKeys,
    onChange: (keys: React.Key[]) => setSelectedKeys(keys as string[]),
  };

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
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
                  <li className="breadcrumb-item">HR</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Resignation
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="mb-2">
                <Link
                  to="#"
                  className="btn btn-primary d-flex align-items-center"
                  data-bs-toggle="modal"
                  data-inert={true}
                  data-bs-target="#new_resignation"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Resignation
                </Link>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          {/* Resignation List */}
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                  <h5 className="d-flex align-items-center">
                    Resignation List
                  </h5>
                  <div className="d-flex align-items-center flex-wrap row-gap-3">
                    <div className="dropdown">
                      <Link
                        to="#"
                        className="d-inline-flex align-items-center fs-12"
                      >
                        <label className="fs-12 d-inline-flex me-1">
                          Sort By :{" "}
                        </label>
                        <CommonSelect
                          className="select"
                          options={[
                            { value: "today", label: "Today" },
                            { value: "yesterday", label: "Yesterday" },
                            { value: "last7days", label: "Last 7 Days" },
                            { value: "last30days", label: "Last 30 Days" },
                            { value: "thismonth", label: "This Month" },
                            { value: "lastmonth", label: "Last Month" },
                            { value: "thisyear", label: "This Year" },
                            { value: "alltime", label: "All Time"},
                          ]}
                          defaultValue={filterType}
                          onChange={handleFilterChange}
                        />
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="card-body p-0">
                  <Table dataSource={rows} columns={columns} Selection={true} />
                </div>
              </div>
            </div>
          </div>
          {/* /Resignation List  */}
        </div>
        {/* Footer */}
        <div className="footer d-sm-flex align-items-center justify-content-between bg-white border-top p-3">
          <p className="mb-0">2014 - 2025 © SmartHR.</p>
          <p>
            Designed &amp; Developed By{" "}
            <Link to="#" className="text-primary">
              Dreams
            </Link>
          </p>
        </div>
        {/* /Footer */}
      </div>
      {/* Add Resignation */}
      <div className="modal fade" id="new_resignation">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Resignation</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Resigning Employee</label>
                      <CommonSelect
                          className="select"
                          options={trainingEmployeeOptions}
                          defaultValue={addForm.employeeName}
                          onChange={(opt: {value: string}) =>
                            setAddForm({
                              ...addForm,
                              employeeName: opt.value,
                            })
                          }
                        />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Department</label>
                      <CommonSelect
                              className="select"
                              defaultValue={toOption(addForm.department)} 
                              onChange={(opt: OptionDepartments | null) =>setAddForm({ ...addForm, department: typeof opt === "string" ? opt : (opt?.value ?? "") })}
                              options={departmentsOptions}
                            />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Reason</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        defaultValue={addForm.reason}
                        onChange={(e) =>
                          setAddForm({ ...addForm, reason: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Notice Date</label>
                      <div className="input-icon-end position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format={{
                            format: "DD-MM-YYYY",
                            type: "mask",
                          }}
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY"
                          onChange={(_, dateString) =>
                            setAddForm({
                              ...addForm,
                              noticeDate: dateString as string,
                            })
                          }
                          value={addForm.noticeDate ? dayjs(addForm.noticeDate, "DD-MM-YYYY") : null}
                              disabledDate={(current) => {
                                return current && current < dayjs().startOf('day');
                              }}
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar text-gray-7" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Resignation Date</label>
                      <div className="input-icon-end position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format={{
                            format: "DD-MM-YYYY",
                            type: "mask",
                          }}
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY"
                          onChange={(_, dateString) =>
                            setAddForm({
                              ...addForm,
                              resignationDate: dateString as string,
                            })
                          }
                            value={addForm.resignationDate ? dayjs(addForm.resignationDate, "DD-MM-YYYY") : null}
                              disabledDate={(current) => {
                                if (!current) return false;
                                if (!addForm.noticeDate) {
                                  return current < dayjs().startOf('day');
                                }
                                const noticeDate = dayjs(addForm.noticeDate, "DD-MM-YYYY");
                                return current < noticeDate.startOf('day');
                              }}
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar text-gray-7" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-white border me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-bs-dismiss="modal"
                  className="btn btn-primary"
                  onClick={handleAddSave}
                >
                  Add Resignation
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Resignation */}
      {/* Edit Resignation */}
      <div className="modal fade" id="edit_resignation">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Resignation</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Resigning Employee&nbsp;
                      </label>
                      <CommonSelect
                          className="select"
                          options={trainingEmployeeOptions}
                          defaultValue={editForm.employeeName}
                          onChange={(optt: {value: string}) =>
                            setEditForm({
                              ...editForm,
                              employeeName: optt.value,
                            })
                          }
                        />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Department</label>
                      <CommonSelect
                              className="select"
                              defaultValue={toOption(editForm.department)} 
                              onChange={(opt: OptionDepartments | null) =>setEditForm({ ...editForm, department: typeof opt === "string" ? opt : (opt?.value ?? "") })}
                              options={departmentsOptions}
                            />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Reason</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        defaultValue={editForm.reason}
                        onChange={(e) =>
                          setEditForm({ ...editForm, reason: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Notice Date</label>
                      <div className="input-icon-end position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format={{ format: "DD-MM-YYYY", type: "mask" }}
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY"
                          defaultValue={
                            editForm.noticeDate
                              ? dayjs(editForm.noticeDate, "DD-MM-YYYY")
                              : null
                          }
                          onChange={(_, dateString) =>
                            setEditForm({
                              ...editForm,
                              noticeDate: dateString as string,
                            })
                          }
                            value={editForm.noticeDate ? dayjs(editForm.noticeDate, "DD-MM-YYYY") : null}
                              disabledDate={(current) => {
                                return current && current < dayjs().startOf('day');
                              }}
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar text-gray-7" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Resignation Date</label>
                      <div className="input-icon-end position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format={{ format: "DD-MM-YYYY", type: "mask" }}
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY"
                          defaultValue={
                            editForm.resignationDate
                              ? dayjs(editForm.resignationDate, "DD-MM-YYYY")
                              : null
                          }
                          onChange={(_, dateString) =>
                            setEditForm({
                              ...editForm,
                              resignationDate: dateString as string,
                            })
                          }
                            value={editForm.resignationDate ? dayjs(editForm.resignationDate, "DD-MM-YYYY") : null}
                              disabledDate={(current) => {
                                if (!current) return false;
                                if (!editForm.noticeDate) {
                                  return current < dayjs().startOf('day');
                                }
                                const noticeDate = dayjs(editForm.noticeDate, "DD-MM-YYYY");
                                return current < noticeDate.startOf('day');
                              }}
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar text-gray-7" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-white border me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-bs-dismiss="modal"
                  className="btn btn-primary"
                  onClick={handleEditSave}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Resignation */}
    </>
  );
};

export default Resignation;
