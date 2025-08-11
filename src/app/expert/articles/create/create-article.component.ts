// ...existing code from previous create-article.component.ts...
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ArticlesService } from '../articles.service';
import { ExpertService } from '../../categories/categories.service';
import { ExpertLayoutComponent } from '../../shared/expert-layout/expert-layout.component';

@Component({
	selector: 'app-create-article',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, ExpertLayoutComponent],
	templateUrl: './create-article.component.html',
	styleUrls: ['./create-article.component.scss']
})
export class CreateArticleComponent implements OnInit {
	articleForm: FormGroup;
	categories: any[] = [];
	isLoading = false;
	error: string | null = null;
	success: string | null = null;
	showCategoryForm = false;
	categoryForm: FormGroup;

	imageFile: File | null = null;
	imagePreview: string | null = null;
	uploadedImageUrl: string | null = null;

			constructor(
				private fb: FormBuilder,
				private articlesService: ArticlesService,
				private expertService: ExpertService,
				private cdr: ChangeDetectorRef
			) {
			this.articleForm = this.fb.group({
				title: ['', Validators.required],
				content: ['', Validators.required],
				categoryId: ['', Validators.required]
			});
			this.categoryForm = this.fb.group({
				name: ['', Validators.required],
				description: ['']
			});
			// Load categories immediately
			this.loadCategories();
		}

	ngOnInit(): void {
		this.loadCategories();
	}

		loadCategories(): void {
			this.expertService.listCategories(0, 50).subscribe({
				next: (res) => {
					this.categories = res.data || [];
					this.cdr.detectChanges();
				},
				error: () => {
					this.categories = [];
					this.cdr.detectChanges();
				}
			});
		}

		onImageSelected(event: Event): void {
			const input = event.target as HTMLInputElement;
			if (input.files && input.files.length > 0) {
				this.imageFile = input.files[0];
				const reader = new FileReader();
				reader.onload = () => {
					this.imagePreview = reader.result as string;
					this.cdr.detectChanges();
				};
				reader.readAsDataURL(this.imageFile);
				this.uploadImage();
			}
		}

		uploadImage(): void {
			if (!this.imageFile) return;
			this.isLoading = true;
			this.articlesService.uploadArticleImage(this.imageFile).subscribe({
				next: (res) => {
					this.uploadedImageUrl = res.data;
					this.isLoading = false;
					this.error = null;
					this.cdr.detectChanges();
				},
				error: () => {
					this.error = 'Upload ảnh thất bại.';
					this.isLoading = false;
					this.cdr.detectChanges();
				}
			});
		}

	submitArticle(): void {
		if (this.articleForm.invalid) return;
		this.isLoading = true;
			const payload = {
				...this.articleForm.value,
				imageUrls: this.uploadedImageUrl ? [this.uploadedImageUrl] : []
			};
			this.articlesService.createArticle(payload).subscribe({
			next: () => {
				this.success = 'Tạo bài viết thành công!';
				this.error = null;
				this.isLoading = false;
				this.articleForm.reset();
				this.imageFile = null;
				this.imagePreview = null;
				this.uploadedImageUrl = null;
			},
			error: () => {
				this.error = 'Tạo bài viết thất bại.';
				this.success = null;
				this.isLoading = false;
			}
		});
	}

		toggleCategoryForm(): void {
			if (!this.showCategoryForm) {
				// Đang mở popup, không reset form
				this.showCategoryForm = true;
				this.error = null;
				this.success = null;
			} else {
				// Đang đóng popup, reset form
				this.showCategoryForm = false;
				this.categoryForm.reset();
				this.error = null;
				this.success = null;
			}
		}

		submitCategory(): void {
			if (this.categoryForm.invalid) return;
			this.isLoading = true;
			this.expertService.createCategory(this.categoryForm.value).subscribe({
				next: (res) => {
					this.success = 'Tạo chuyên mục thành công!';
					this.error = null;
					this.isLoading = false;
					// Reload categories and select the new one
					this.expertService.listCategories(0, 50).subscribe({
						next: (catRes) => {
							this.categories = catRes.data || [];
							// Try to select the newly created category
							if (res && res.data) {
								const newCat = this.categories.find(c => c.id === res.data);
								if (newCat) {
									this.articleForm.patchValue({ categoryId: newCat.id });
								}
							}
						},
						error: () => {
							this.categories = [];
						}
					});
					this.toggleCategoryForm();
				},
				error: () => {
					this.error = 'Tạo chuyên mục thất bại.';
					this.success = null;
					this.isLoading = false;
				}
			});
		}
}
