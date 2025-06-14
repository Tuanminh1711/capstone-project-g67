import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyGreenSpace } from './my-green-space';

describe('MyGreenSpace', () => {
  let component: MyGreenSpace;
  let fixture: ComponentFixture<MyGreenSpace>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyGreenSpace]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyGreenSpace);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
