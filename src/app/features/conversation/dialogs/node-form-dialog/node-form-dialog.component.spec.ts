import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeFormDialogComponent } from './node-form-dialog.component';

describe('NodeFormDialogComponent', () => {
  let component: NodeFormDialogComponent;
  let fixture: ComponentFixture<NodeFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeFormDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NodeFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
