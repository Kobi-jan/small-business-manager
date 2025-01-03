document.addEventListener("DOMContentLoaded", async () => {
    async function fetchConversations() {
        try {
            const response = await fetch('/customers/api/messages/conversations');
            const data = await response.json();

            const conversationList = document.getElementById("conversationList");
            conversationList.innerHTML = ""; // Clear existing content

            data.forEach(conversation => {
                const listItem = document.createElement("li");
                listItem.textContent = conversation.business_name;
                listItem.dataset.businessId = conversation.business_id;

                listItem.addEventListener("click", () => {
                    loadChat(conversation.business_id, conversation.business_name);
                    document.querySelectorAll(".conversation-list li").forEach(item => item.classList.remove("active"));
                    listItem.classList.add("active");
                });
                
                conversationList.appendChild(listItem);
            });
        } catch (error) {
            console.error("Error fetching conversations:", error);
        }
    }

    // Fetch and display messages for a selected business
    async function loadChat(businessId, businessName) {
        document.getElementById("chatWith").textContent = `Chat with: ${businessName}`;
        const chatMessages = document.getElementById("chatMessages");
        chatMessages.innerHTML = ""; // Clear existing messages

        try {
            const response = await fetch(`/customers/api/messages/${businessId}`);
            const data = await response.json();

            if (data.messages && data.messages.length) {
                data.messages.forEach(message => {
                    const messageDiv = document.createElement("div");
                    messageDiv.className = message.sender_type === "customer" ? "message customer" : "message business";
                    messageDiv.textContent = message.message_text;
                    chatMessages.appendChild(messageDiv);
                });
            } else {
                chatMessages.innerHTML = "<p>No messages found.</p>";
            }
        } catch (error) {
            console.error("Error loading chat:", error);
        }
    }

    // Send a new message
    document.getElementById("sendMessageBtn").addEventListener("click", async () => {
        const chatInput = document.getElementById("chatInput");
        const messageText = chatInput.value.trim();
        const businessId = document.querySelector(".conversation-list li.active")?.dataset.businessId;

        if (!messageText || !businessId) return alert("Select a conversation and type a message!");

        try {
            const response = await fetch(`/customers/api/messages/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    businessId,  
                    messageText  
                })
            });

            if (response.ok) {
                chatInput.value = "";  
                loadChat(businessId);  
            } else {
                console.error("Error sending message:", await response.json());
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    });

    // Fetch conversations when the page loads
    fetchConversations();
});
