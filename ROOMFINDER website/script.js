document.addEventListener('DOMContentLoaded', () => {
    // Initialize search functionality
    initializeSearch();
    
    // Initialize location filters
    initializeLocationFilters();
    
    // Initialize modal functionality
    initializeModal();

    // Smooth scrolling for anchor links
    const smoothScroll = (target, duration) => {
        const targetPosition = document.querySelector(target).offsetTop;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        const animation = currentTime => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        };

        const ease = (t, b, c, d) => {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        };

        requestAnimationFrame(animation);
    };

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            smoothScroll(this.getAttribute('href'), 1000);
        });
    });

    // Form validation
    const searchForm = document.querySelector('.search-form');
    searchForm.addEventListener('submit', (e) => {
        const searchInput = document.querySelector('.search-input');
        if (searchInput.value.trim() === '') {
            e.preventDefault();
            alert('Please enter a search term.');
        }
    });

    // Toggle menu for mobile
    const menuToggle = document.querySelector('.menu-toggle');
    const navbarLinks = document.querySelector('.navbar-links');
    
    if (menuToggle && navbarLinks) {
        menuToggle.addEventListener('click', () => {
            navbarLinks.classList.toggle('active');
        });
    }

    // Testimonial Slider
    const testimonials = document.querySelectorAll('.testimonial');
    let currentTestimonial = 0;

    function showTestimonial(index) {
        testimonials.forEach((testimonial, i) => {
            testimonial.style.display = i === index ? 'block' : 'none';
        });
    }

    function nextTestimonial() {
        currentTestimonial = (currentTestimonial + 1) % testimonials.length;
        showTestimonial(currentTestimonial);
    }

    // Initialize slider
    showTestimonial(0);
    // Auto-advance every 5 seconds
    setInterval(nextTestimonial, 5000);

    // FAQ Accordion
    document.querySelectorAll('.faq-item').forEach(item => {
        item.addEventListener('click', () => {
            // Close other open items
            document.querySelectorAll('.faq-item').forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
        });
    });

    // Room Filtering
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const searchTerm = document.querySelector('.search-input').value;
        
        try {
            const response = await fetch(`/api/rooms/search?q=${encodeURIComponent(searchTerm)}`);
            const rooms = await response.json();
            updateRoomGrid(rooms);
        } catch (error) {
            console.error('Search error:', error);
            alert('Error performing search. Please try again.');
        }
    });

    // Room Details Modal
    const modal = document.getElementById('roomDetailsModal');
    const closeModal = document.querySelector('.close-modal');
    
    // Close modal when clicking the close button
    if (closeModal && modal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Handle booking form submission
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = {
                checkIn: document.getElementById('checkIn').value,
                checkOut: document.getElementById('checkOut').value,
                roomId: bookingForm.getAttribute('data-room-id')
            };

            // Validate dates
            if (new Date(formData.checkIn) >= new Date(formData.checkOut)) {
                alert('Check-out date must be after check-in date');
                return;
            }

            try {
                const response = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    alert('Booking successful!');
                    modal.style.display = 'none';
                    // Optionally refresh the room list
                    location.reload();
                } else {
                    const error = await response.json();
                    alert(error.message || 'Failed to book room. Please try again.');
                }
            } catch (error) {
                console.error('Booking error:', error);
                alert('Error processing booking. Please try again.');
            }
        });
    }

    function showRoomDetails(roomId) {
        // Add loading state
        const button = event.target;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        
        fetch(`/api/rooms/${roomId}`)
            .then(response => response.json())
            .then(room => {
                // Create modal content
                const modalContent = `
                    <div class="room-modal">
                        <div class="modal-header">
                            <h2>${room.room_type}</h2>
                            <span class="modal-price">$${room.price}/month</span>
                        </div>
                        
                        <div class="modal-gallery">
                            <img src="${room.image_url}" alt="${room.room_type}">
                        </div>
                        
                        <div class="modal-details">
                            <div class="location-info">
                                <i class="fas fa-map-marker-alt"></i>
                                <div>
                                    <h3>Location</h3>
                                    <p>${room.location}</p>
                                </div>
                            </div>
                            
                            <div class="contact-info">
                                <i class="fas fa-phone"></i>
                                <div>
                                    <h3>Contact Owner</h3>
                                    <p class="phone">${room.owner_contact_number}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="amenities-grid">
                            ${room.amenities.split(',').map(amenity => `
                                <div class="amenity-item">
                                    <i class="fas fa-check-circle"></i>
                                    <span>${amenity.trim()}</span>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="room-description">
                            <h3>About this Room</h3>
                            <p>${room.description}</p>
                        </div>
                    </div>
                `;
                
                // Show modal with animation
                const modal = document.getElementById('roomDetailsModal');
                modal.innerHTML = modalContent;
                modal.style.display = 'block';
                setTimeout(() => modal.classList.add('show'), 10);
                
                // Reset button
                button.innerHTML = 'View Details';
            })
            .catch(error => {
                console.error('Error:', error);
                button.innerHTML = 'View Details';
                alert('Error loading room details. Please try again.');
            });
    }

    // Make showRoomDetails available globally
    window.showRoomDetails = showRoomDetails;

    // Location Search Filter
    const locationSearch = document.getElementById('locationSearch');
    const locationCards = document.querySelectorAll('.location-card');

    if (locationSearch) {
        locationSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            locationCards.forEach(card => {
                const locationName = card.getAttribute('data-location').toLowerCase();
                const locationInfo = card.querySelector('.location-info').textContent.toLowerCase();
                
                if (locationName.includes(searchTerm) || locationInfo.includes(searchTerm)) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeInUp 0.6s ease forwards';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // Add click handlers for location cards
    locationCards.forEach(card => {
        card.addEventListener('click', () => {
            const location = card.getAttribute('data-location');
            // Smooth scroll to rooms section
            const roomsSection = document.querySelector('.featured-rooms');
            roomsSection.scrollIntoView({ behavior: 'smooth' });
            
            // Filter rooms by location (you'll need to implement this)
            filterRoomsByLocation(location);
        });
    });

    // Footer Links
    document.querySelectorAll('.footer-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href === '##') {
                e.preventDefault();
                alert('This page is under construction.');
            }
        });
    });

    // Initialize date inputs with min dates
    const today = new Date().toISOString().split('T')[0];
    const checkInInput = document.getElementById('checkIn');
    const checkOutInput = document.getElementById('checkOut');
    
    if (checkInInput && checkOutInput) {
        checkInInput.min = today;
        checkInInput.addEventListener('change', () => {
            checkOutInput.min = checkInInput.value;
        });
    }

    const slider = document.querySelector('.testimonial-slider');
    
    // Add slider dots
    const sliderNav = document.createElement('div');
    sliderNav.className = 'slider-nav';
    
    testimonials.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'slider-dot' + (index === 0 ? ' active' : '');
        dot.addEventListener('click', () => scrollToTestimonial(index));
        sliderNav.appendChild(dot);
    });
    
    slider.parentElement.appendChild(sliderNav);
    
    // Scroll handling
    let isScrolling;
    slider.addEventListener('scroll', () => {
        window.clearTimeout(isScrolling);
        isScrolling = setTimeout(() => {
            const index = Math.round(slider.scrollLeft / slider.offsetWidth);
            updateActiveDot(index);
        }, 100);
    });
    
    function scrollToTestimonial(index) {
        slider.scrollTo({
            left: index * slider.offsetWidth,
            behavior: 'smooth'
        });
        updateActiveDot(index);
    }
    
    function updateActiveDot(index) {
        document.querySelectorAll('.slider-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }
    
    // Auto scroll
    let autoScrollInterval;
    
    function startAutoScroll() {
        autoScrollInterval = setInterval(() => {
            const currentIndex = Math.round(slider.scrollLeft / slider.offsetWidth);
            const nextIndex = (currentIndex + 1) % testimonials.length;
            scrollToTestimonial(nextIndex);
        }, 5000);
    }
    
    function stopAutoScroll() {
        clearInterval(autoScrollInterval);
    }
    
    slider.addEventListener('mouseenter', stopAutoScroll);
    slider.addEventListener('mouseleave', startAutoScroll);
    
    startAutoScroll();

    // Contact Form Handling
    document.getElementById('contactForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Add loading state
        const button = this.querySelector('button');
        const originalText = button.textContent;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        
        // Simulate form submission
        setTimeout(() => {
            alert('Thank you for your message! We will get back to you soon.');
            this.reset();
            button.textContent = originalText;
        }, 1500);
    });

    // Form input animations
    document.querySelectorAll('.form-group input, .form-group textarea').forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
    });

    // Enhanced Newsletter Form
    document.querySelector('.newsletter-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = this.querySelector('input[type="email"]');
        const button = this.querySelector('button');
        
        if (!isValidEmail(email.value)) {
            showFormError(email, 'Please enter a valid email address');
            return;
        }
        
        // Add loading state with animation
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subscribing...';
        email.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            showSuccessMessage('Thank you for subscribing! 🎉');
            this.reset();
            button.disabled = false;
            email.disabled = false;
            button.textContent = 'Subscribe';
        }, 1500);
    });

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showFormError(input, message) {
        const existingError = input.parentElement.querySelector('.error-message');
        if (existingError) existingError.remove();
        
        const error = document.createElement('div');
        error.className = 'error-message';
        error.textContent = message;
        error.style.color = '#ff4444';
        error.style.fontSize = '1.4rem';
        error.style.marginTop = '0.5rem';
        
        input.parentElement.appendChild(error);
        input.style.borderColor = '#ff4444';
        
        setTimeout(() => {
            error.remove();
            input.style.borderColor = '';
        }, 3000);
    }

    function showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.position = 'fixed';
        successDiv.style.top = '20px';
        successDiv.style.right = '20px';
        successDiv.style.background = '#28a745';
        successDiv.style.color = 'white';
        successDiv.style.padding = '1.5rem 3rem';
        successDiv.style.borderRadius = '8px';
        successDiv.style.zIndex = '1000';
        successDiv.style.animation = 'slideIn 0.5s ease forwards';
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.style.animation = 'slideOut 0.5s ease forwards';
            setTimeout(() => successDiv.remove(), 500);
        }, 3000);
    }

    // Enhanced Statistics Animation
    const stats = document.querySelectorAll('.stat-item');
    let animated = false;

    const animateValue = (element, start, end, duration) => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = value.toLocaleString();
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animated) {
                animated = true;
                stats.forEach(stat => {
                    stat.classList.add('animate');
                    const h3 = stat.querySelector('h3');
                    const targetValue = parseInt(h3.textContent);
                    h3.textContent = '0';
                    animateValue(h3, 0, targetValue, 2000);
                });
            }
        });
    }, { threshold: 0.5 });

    document.querySelector('.statistics')?.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.querySelector('.statistics'));
    });

    // Add CSS animations
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    `;
    document.head.appendChild(styleSheet);
});

function initializeSearch() {
    const searchForm = document.querySelector('.search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const searchInput = document.querySelector('.search-input');
            const searchTerm = searchInput.value.trim();
            
            if (!searchTerm) {
                showNotification('Please enter a search term');
                return;
            }

            try {
                const response = await fetch(`/api/rooms?location=${encodeURIComponent(searchTerm)}`);
                if (!response.ok) throw new Error('Search failed');
                
                const rooms = await response.json();
                if (rooms.length === 0) {
                    showNotification('No rooms found in this location');
                    return;
                }
                
                updateRoomGrid(rooms);
            } catch (error) {
                console.error('Search error:', error);
                showNotification('Error performing search. Please try again.');
            }
        });
    }
}

function initializeLocationFilters() {
    const locationCards = document.querySelectorAll('.location-card');
    locationCards.forEach(card => {
        card.addEventListener('click', async () => {
            const location = card.getAttribute('data-location');
            try {
                const response = await fetch(`/api/rooms?location=${encodeURIComponent(location)}`);
                if (!response.ok) throw new Error('Failed to fetch rooms');
                
                const rooms = await response.json();
                updateRoomGrid(rooms);
                
                // Smooth scroll to rooms section
                document.querySelector('.featured-rooms').scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            } catch (error) {
                console.error('Error:', error);
                showNotification('Error loading rooms. Please try again.');
            }
        });
    });
}

function initializeModal() {
    const modal = document.getElementById('roomDetailsModal');
    const closeModal = document.querySelector('.close-modal');
    
    if (closeModal && modal) {
        closeModal.addEventListener('click', () => closeRoomDetails());
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) closeRoomDetails();
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeRoomDetails();
        });
    }
}

function showRoomDetails(roomId) {
    // Add loading state
    const button = event.target;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    
    fetch(`/api/rooms/${roomId}`)
        .then(response => response.json())
        .then(room => {
            // Create modal content
            const modalContent = `
                <div class="room-modal">
                    <div class="modal-header">
                        <h2>${room.room_type}</h2>
                        <span class="modal-price">$${room.price}/month</span>
                    </div>
                    
                    <div class="modal-gallery">
                        <img src="${room.image_url}" alt="${room.room_type}">
                    </div>
                    
                    <div class="modal-details">
                        <div class="location-info">
                            <i class="fas fa-map-marker-alt"></i>
                            <div>
                                <h3>Location</h3>
                                <p>${room.location}</p>
                            </div>
                        </div>
                        
                        <div class="contact-info">
                            <i class="fas fa-phone"></i>
                            <div>
                                <h3>Contact Owner</h3>
                                <p class="phone">${room.owner_contact_number}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="amenities-grid">
                        ${room.amenities.split(',').map(amenity => `
                            <div class="amenity-item">
                                <i class="fas fa-check-circle"></i>
                                <span>${amenity.trim()}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="room-description">
                        <h3>About this Room</h3>
                        <p>${room.description}</p>
                    </div>
                </div>
            `;
            
            // Show modal with animation
            const modal = document.getElementById('roomDetailsModal');
            modal.innerHTML = modalContent;
            modal.style.display = 'block';
            setTimeout(() => modal.classList.add('show'), 10);
            
            // Reset button
            button.innerHTML = 'View Details';
        })
        .catch(error => {
            console.error('Error:', error);
            button.innerHTML = 'View Details';
            alert('Error loading room details. Please try again.');
        });
}

function closeRoomDetails() {
    const modal = document.getElementById('roomDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showNotification(message) {
    // You can implement a custom notification system here
    alert(message);
}

function updateRoomGrid(rooms) {
    const roomGrid = document.querySelector('.room-grid');
    if (!roomGrid) return;

    roomGrid.innerHTML = rooms.map(room => `
        <div class="room-card">
            <div class="room-image">
                <img src="${room.image_url}" alt="${room.room_type}" 
                     onerror="this.src='img/rooms/default-room.jpg'">
                <span class="price">$${room.price}/month</span>
            </div>
            <div class="room-info">
                <h3>${room.room_type}</h3>
                <p class="location">
                    <i class="fas fa-map-marker-alt"></i> ${room.location}
                </p>
                <div class="amenities">
                    ${room.amenities.split(',').slice(0, 3).map(amenity => 
                        `<span><i class="fas fa-check"></i> ${amenity.trim()}</span>`
                    ).join('')}
                </div>
                <button class="view-details" onclick="showRoomDetails(${room.room_id})">
                    View Details & Contact
                </button>
            </div>
        </div>
    `).join('');
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('roomDetailsModal');
    if (e.target === modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    }
});

// Add smooth scrolling for better UX
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

function filterRoomsByLocation(location) {
    // Add your room filtering logic here
    console.log(`Filtering rooms for location: ${location}`);
    // You can implement API call or filtering mechanism
}
