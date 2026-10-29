import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservaFormComponent } from './reserva-form.component';

describe('ReservaFormComponent', () => {
  let component: ReservaFormComponent;
  let fixture: ComponentFixture<ReservaFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservaFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
