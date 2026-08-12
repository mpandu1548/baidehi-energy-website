from django.db import models


class TeamMember(models.Model):
    CATEGORY_CHOICES = [
    ("leadership", "Leadership"),
    ("board", "Board of Directors"),
    ("advisor", "Advisors"),
    ("technical", "Technical Team"),
    ("corporate", "Corporate Support"),
]

    name = models.CharField(max_length=150)
    position = models.CharField(max_length=150)
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default="technical"
    )
    photo = models.ImageField(
        upload_to="team/",
        blank=True,
        null=True
    )
    bio = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["category", "order", "name"]

    def __str__(self):
        return f"{self.name} - {self.position}"


class GalleryImage(models.Model):
    title = models.CharField(max_length=200)
    image = models.ImageField(upload_to="gallery/")
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "-created_at"]

    def __str__(self):
        return self.title


class NewsNotice(models.Model):
    title = models.CharField(max_length=250)
    image = models.ImageField(
        upload_to="news/",
        blank=True,
        null=True
    )
    content = models.TextField()
    published_date = models.DateField()
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-published_date", "-created_at"]

    def __str__(self):
        return self.title


class ContactMessage(models.Model):
    name = models.CharField(max_length=150)
    company = models.CharField(max_length=150, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True)
    subject = models.CharField(max_length=250)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - {self.subject}"