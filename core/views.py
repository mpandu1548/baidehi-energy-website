from django.shortcuts import render, redirect
from django.db.models import Case, When, Value, IntegerField

from .models import ContactMessage, GalleryImage, TeamMember, NewsNotice


def home(request):
    latest_news = NewsNotice.objects.filter(
        is_published=True
    ).order_by("-published_date")[:3]

    gallery_images = GalleryImage.objects.filter(
        is_active=True
    ).order_by("-id")[:3]

    return render(
        request,
        "home.html",
        {
            "latest_news": latest_news,
            "gallery_images": gallery_images,
        }
    )


def about(request):
    members = TeamMember.objects.filter(
        is_active=True
    ).order_by(
        "category",
        "order",
        "name"
    )

    return render(
        request,
        "about.html",
        {
            "members": members,
        }
    )

def project(request):
    return render(request, "project.html")


def gallery(request):
    images = GalleryImage.objects.filter(
        is_active=True
    )

    return render(
        request,
        "gallery.html",
        {
            "images": images
        }
    )


def team(request):
    members = TeamMember.objects.filter(
        is_active=True
    ).annotate(
        category_order=Case(
            When(
                category="leadership",
                then=Value(1)
            ),
            When(
                category="board",
                then=Value(2)
            ),
            When(
                category="advisor",
                then=Value(3)
            ),
            When(
                category="technical",
                then=Value(4)
            ),
            When(
                category="corporate",
                then=Value(5)
            ),
            default=Value(99),
            output_field=IntegerField(),
        )
    ).order_by(
        "category_order",
        "order",
        "name"
    )

    return render(
        request,
        "team.html",
        {
            "members": members
        }
    )


def news(request):
    notices = NewsNotice.objects.filter(
        is_published=True
    )

    return render(
        request,
        "news.html",
        {
            "notices": notices
        }
    )


def contact(request):

    if request.method == "POST":

        ContactMessage.objects.create(
            name=request.POST.get("name"),
            company=request.POST.get("company"),
            email=request.POST.get("email"),
            phone=request.POST.get("phone"),
            subject=request.POST.get("subject"),
            message=request.POST.get("message"),
        )

        return redirect("/contact/?sent=1")

    message_sent = request.GET.get("sent") == "1"

    return render(
        request,
        "contact.html",
        {
            "message_sent": message_sent,
        }
    )


def chairman(request):
    return render(request, "chairman.html")