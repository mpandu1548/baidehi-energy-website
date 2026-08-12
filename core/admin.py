from django.contrib import admin

from .models import (
    GalleryImage,
    TeamMember,
    NewsNotice,
    ContactMessage,
)


@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display = ("title", "order", "is_active", "created_at")
    list_filter = ("is_active",)
    ordering = ("order", "-created_at")


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ("name", "position", "category", "order", "is_active")
    list_filter = ("category", "is_active")
    ordering = ("category", "order", "name")


@admin.register(NewsNotice)
class NewsNoticeAdmin(admin.ModelAdmin):
    list_display = ("title", "published_date", "is_published", "created_at")
    list_filter = ("is_published",)
    ordering = ("-published_date", "-created_at")


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "company",
        "email",
        "phone",
        "subject",
        "created_at",
    )

    list_filter = ("created_at",)

    search_fields = (
        "name",
        "company",
        "email",
        "subject",
        "message",
    )

    readonly_fields = ("created_at",)

    ordering = ("-created_at",)