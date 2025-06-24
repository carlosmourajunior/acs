import React, { useState } from 'react';
import type { ReactElement } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  TablePagination,
  Chip,
  Typography,
  Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any) => string | ReactElement;
}

interface DataTableProps {
  columns: Column[];
  rows: any[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onView?: (row: any) => void;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  onEdit,
  onDelete,
  onView,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  // Função para renderizar valores especiais
  const renderCell = (column: Column, value: any) => {
    if (column.id === 'status') {
      return (
        <Chip
          icon={value === 'Online' ? <WifiIcon /> : <WifiOffIcon />}
          label={value}
          color={value === 'Online' ? 'success' : 'error'}
          variant="outlined"
          size="small"
        />
      );
    }

    if (column.id === 'lastContact') {
      if (!value) return <Typography variant="body2" color="text.secondary">Nunca</Typography>;
      const date = new Date(value);
      const formattedDate = date.toLocaleString();
      const timeAgo = getTimeAgo(date);
      return (
        <Tooltip title={formattedDate}>
          <Typography variant="body2">{timeAgo}</Typography>
        </Tooltip>
      );
    }

    if (column.format) {
      return column.format(value);
    }

    if (value === 'N/A' || value === 'Unknown' || value === 'Error') {
      return <Typography variant="body2" color="text.secondary">{value}</Typography>;
    }

    return value;
  };

  // Função para calcular tempo relativo
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);    if (days > 0) return `${days} ${days === 1 ? 'dia' : 'dias'} atrás`;
    if (hours > 0) return `${hours} ${hours === 1 ? 'hora' : 'horas'} atrás`;
    if (minutes > 0) return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} atrás`;
    return 'agora mesmo';
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth, fontWeight: 'bold' }}
                >
                  {column.label}
                </TableCell>
              ))}
              <TableCell align="right" style={{ minWidth: 100 }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => {
                return (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row._id || index}>
                    {columns.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell key={column.id} align={column.align}>
                          {renderCell(column, value)}
                        </TableCell>
                      );
                    })}
                    <TableCell align="right">
                      <Box>
                        {onView && (
                          <Tooltip title="Ver Detalhes">
                            <IconButton
                              onClick={() => onView(row)}
                              size="small"
                              color="primary"
                            >
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onEdit && (
                          <Tooltip title="Editar">
                            <IconButton
                              onClick={() => onEdit(row)}
                              size="small"
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onDelete && (
                          <Tooltip title="Excluir">
                            <IconButton
                              onClick={() => onDelete(row)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default DataTable;
