import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TopNavigator} from './top-navigator';

describe('TopNavigator', () => {
    let component: TopNavigator;
    let fixture: ComponentFixture<TopNavigator>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TopNavigator]
        })
        .compileComponents();

        fixture = TestBed.createComponent(TopNavigator);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});