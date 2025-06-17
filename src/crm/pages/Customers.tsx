import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

// User interface matching the API response
interface User {
  login: {
    uuid: string;
    username: string;
    password: string;
  };
  name: {
    title: string;
    first: string;
    last: string;
  };
  gender: string;
  location: {
    street: {
      number: number;
      name: string;
    };
    city: string;
    state: string;
    country: string;
    postcode: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    timezone: {
      offset: string;
      description: string;
    };
  };
  email: string;
  dob: {
    date: string;
    age: number;
  };
  registered: {
    date: string;
    age: number;
  };
  phone: string;
  cell: string;
  picture: {
    large: string;
    medium: string;
    thumbnail: string;
  };
  nat: string;
}

interface UsersApiResponse {
  page: number;
  perPage: number;
  total: number;
  span: string;
  effectivePage: number;
  data: User[];
}

// Custom cell renderers
function renderUserAvatar(params: GridRenderCellParams<User>) {
  const user = params.row;
  const fullName = `${user.name.first} ${user.name.last}`;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Avatar
        src={user.picture.thumbnail}
        alt={fullName}
        sx={{ width: 32, height: 32 }}
      >
        {user.name.first.charAt(0)}
        {user.name.last.charAt(0)}
      </Avatar>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {fullName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          @{user.login.username}
        </Typography>
      </Box>
    </Box>
  );
}

function renderContactInfo(params: GridRenderCellParams<User>) {
  const user = params.row;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
        <EmailIcon fontSize="small" color="action" />
        <Typography variant="body2">{user.email}</Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <PhoneIcon fontSize="small" color="action" />
        <Typography variant="body2">{user.phone}</Typography>
      </Box>
    </Box>
  );
}

function renderLocation(params: GridRenderCellParams<User>) {
  const user = params.row;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <LocationOnIcon fontSize="small" color="action" />
      <Box>
        <Typography variant="body2">
          {user.location.city}, {user.location.state}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {user.location.country}
        </Typography>
      </Box>
    </Box>
  );
}

function renderAge(params: GridRenderCellParams<User>) {
  const user = params.row;
  const registeredYears = user.registered.age;

  return (
    <Box>
      <Typography variant="body2">{user.dob.age} years old</Typography>
      <Chip
        label={`${registeredYears}yr customer`}
        size="small"
        color={
          registeredYears >= 3
            ? "success"
            : registeredYears >= 1
              ? "primary"
              : "default"
        }
        variant="outlined"
      />
    </Box>
  );
}

function renderGender(params: GridRenderCellParams<User>) {
  const user = params.row;

  return (
    <Chip
      label={user.gender}
      size="small"
      color={user.gender === "male" ? "primary" : "secondary"}
      variant="outlined"
      icon={<PersonIcon />}
    />
  );
}

function renderActions(params: GridRenderCellParams<User>) {
  return (
    <IconButton size="small" aria-label="more options">
      <MoreVertIcon fontSize="small" />
    </IconButton>
  );
}

// Define columns for the DataGrid
const columns: GridColDef[] = [
  {
    field: "user",
    headerName: "Customer",
    flex: 1.5,
    minWidth: 200,
    renderCell: renderUserAvatar,
    sortable: false,
  },
  {
    field: "contact",
    headerName: "Contact Information",
    flex: 1.5,
    minWidth: 250,
    renderCell: renderContactInfo,
    sortable: false,
  },
  {
    field: "location",
    headerName: "Location",
    flex: 1,
    minWidth: 180,
    renderCell: renderLocation,
    sortable: false,
  },
  {
    field: "age",
    headerName: "Age & Status",
    flex: 1,
    minWidth: 150,
    renderCell: renderAge,
    sortable: false,
  },
  {
    field: "gender",
    headerName: "Gender",
    flex: 0.5,
    minWidth: 100,
    renderCell: renderGender,
    sortable: false,
  },
  {
    field: "actions",
    headerName: "Actions",
    flex: 0.5,
    minWidth: 80,
    renderCell: renderActions,
    sortable: false,
    filterable: false,
  },
];

export default function Customers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Function to fetch users from the API
  const fetchUsers = useCallback(
    async (searchTerm = "", currentPage = 1, perPage = 25) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: currentPage.toString(),
          perPage: perPage.toString(),
          sortBy: "name.first",
        });

        if (searchTerm.trim()) {
          params.append("search", searchTerm.trim());
        }

        const response = await fetch(
          `https://user-api.builder-io.workers.dev/api/users?${params.toString()}`,
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch users: ${response.status} ${response.statusText}`,
          );
        }

        const data: UsersApiResponse = await response.json();

        // Add unique IDs for DataGrid
        const usersWithIds = data.data.map((user, index) => ({
          ...user,
          id: user.login.uuid || `user-${currentPage}-${index}`,
        }));

        setUsers(usersWithIds);
        setTotalUsers(data.total);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch users";
        setError(errorMessage);
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Initial load
  useEffect(() => {
    fetchUsers(searchQuery, page + 1, pageSize);
  }, [fetchUsers, page, pageSize]);

  // Search handler with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(0); // Reset to first page when searching
      fetchUsers(searchQuery, 1, pageSize);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchUsers, pageSize]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(0);
  };

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Customer Management
      </Typography>

      <Card
        variant="outlined"
        sx={{
          height: "calc(100vh - 200px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CardContent sx={{ pb: 1 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Typography variant="h6" component="h2">
              All Customers ({totalUsers.toLocaleString()})
            </Typography>
            <TextField
              placeholder="Search customers by name, email, or city..."
              value={searchQuery}
              onChange={handleSearchChange}
              size="small"
              sx={{ minWidth: { sm: 300 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>

        <Box sx={{ flexGrow: 1, position: "relative" }}>
          {loading && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(255, 255, 255, 0.8)",
                zIndex: 1,
              }}
            >
              <CircularProgress />
            </Box>
          )}

          <DataGrid
            rows={users}
            columns={columns}
            paginationMode="server"
            page={page}
            pageSize={pageSize}
            rowCount={totalUsers}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[10, 25, 50, 100]}
            loading={loading}
            disableColumnResize
            density="comfortable"
            getRowHeight={() => 70}
            getRowClassName={(params) =>
              params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
            }
            sx={{
              border: 0,
              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid",
                borderBottomColor: "divider",
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "action.hover",
              },
              "& .even": {
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.02)"
                    : "grey.50",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              },
            }}
            slotProps={{
              pagination: {
                showFirstButton: true,
                showLastButton: true,
              },
            }}
          />
        </Box>
      </Card>
    </Box>
  );
}
