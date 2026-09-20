import { Component, OnInit, ViewChild, TemplateRef, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// Módulos de Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { UserService } from './service/user.service';
import { User, UserResponse } from 'src/app/core/models/UserResponse';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatCheckboxModule
  ],
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  @ViewChild('userDialog') userDialog!: TemplateRef<any>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['id', 'user', 'email', 'role', 'status', 'created_at', 'acciones'];
  dataSource = new MatTableDataSource<User>([]);
  allUsers: User[] = []; 
  
  selectedStatus: string = 'all';
  selectedRole: string = 'all';

  userForm!: FormGroup;
  isEdit: boolean = false;
  selectedUserId: number | null = null;

  ngOnInit(): void {
    this.initForm();
    this.getUsersList();
    this.setupCustomFilter();
  }
  
  initForm(): void {
  this.userForm = this.fb.group({
    name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    role_id: [2, [Validators.required]]
  });
}

  getUsersList(): void {
    this.userService.getUsers().subscribe({
      next: (response: UserResponse) => {
        const users = Array.isArray(response.data) ? response.data : [response.data];
        this.allUsers = users;
        this.dataSource.data = users;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      error: (err) => console.error('Error al obtener usuarios:', err)
    });
  }

  setupCustomFilter(): void {
    this.dataSource.filterPredicate = (data: User, filter: string) => {
      const fullName = `${data.name || ''} ${data.last_name || ''}`.toLowerCase();
      const email = (data.email || '').toLowerCase();
      const id = data.id ? data.id.toString() : '';
      const search = filter.trim().toLowerCase();

      return fullName.includes(search) || email.includes(search) || id.includes(search);
    };
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filterRole(roleId: string): void {
    this.selectedRole = roleId;
    this.applyCombinedFilters();
  }

  filterStatus(status: string): void {
    this.selectedStatus = status;
    this.applyCombinedFilters();
  }

  applyCombinedFilters(): void {
    let filtered = [...this.allUsers];

    if (this.selectedStatus !== 'all') {
      const isActive = this.selectedStatus === 'active';
      filtered = filtered.filter(u => u.is_active === isActive);
    }

    if (this.selectedRole !== 'all') {
      const roleId = Number(this.selectedRole);
      filtered = filtered.filter(u => u.role_id === roleId);
    }

    this.dataSource.data = filtered;
  }

  openCreateModal(): void {
  this.isEdit = false;
  this.selectedUserId = null;

  // Restaurar validaciones para crear
  this.userForm.get('name')?.setValidators([Validators.required]);
  this.userForm.get('last_name')?.setValidators([Validators.required]);
  this.userForm.get('email')?.setValidators([Validators.required, Validators.email]);
  this.userForm.get('role_id')?.setValidators([Validators.required]);
  this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);

  this.userForm.reset({ role_id: 2 });
  this.userForm.updateValueAndValidity();
  this.dialog.open(this.userDialog, { width: '600px' });
}

editUser(user: User): void {
  this.isEdit = true;
  this.selectedUserId = user.id!;

  this.userForm.get('password')?.clearValidators();

  // 2. Cargar los datos actuales
  this.userForm.patchValue({
    name: user.name,
    last_name: user.last_name,
    email: user.email,
    role_id: user.role_id,
    password: ''
  });

  this.userForm.get('password')?.updateValueAndValidity();
  this.dialog.open(this.userDialog, { width: '600px' });
}

saveUser(): void {
  const formValues = { ...this.userForm.value };

  if (this.isEdit) {
    if (!formValues.password) {
      delete formValues.password;
    }

    if (this.selectedUserId) {
      this.userService.updateUser(this.selectedUserId, formValues).subscribe({
        next: () => {
          this.dialog.closeAll();
          this.getUsersList();
        },
        error: (err) => console.error('Error al actualizar usuario:', err)
      });
    }
  } else {
    if (this.userForm.invalid) return;

    this.userService.createUser(formValues).subscribe({
      next: () => {
        this.dialog.closeAll();
        this.getUsersList();
      },
      error: (err) => console.error('Error al crear usuario:', err)
    });
  }
}

toggleUserStatus(user: User): void {
  if (!user.id) return;

  const newStatus = !user.is_active;

  this.userService.updateUserStatus(user.id, newStatus).subscribe({
    next: () => {
      user.is_active = newStatus;

      if (this.selectedStatus !== 'all') {
        this.applyCombinedFilters();
      }
    },
    error: (err) => {
      console.error('Error al cambiar el estado del usuario:', err);
    }
  });
}
}