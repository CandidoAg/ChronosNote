using Xunit;
using Moq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using ChronosNote.Api.Hubs;

namespace ChronosNote.Api.Services;

public class SignalRNotificationServiceTests
{
    [Fact]
    public async Task SendReminderAlertAsync_Should_Send_SignalR_Message_To_All_Clients()
    {
        var hubContextMock = new Mock<IHubContext<NotificationHub>>();
        var hubClientsMock = new Mock<IHubClients>();
        var clientProxyMock = new Mock<IClientProxy>();

        hubContextMock.Setup(h => h.Clients).Returns(hubClientsMock.Object);
        hubClientsMock.Setup(c => c.All).Returns(clientProxyMock.Object);

        var service = new SignalRNotificationService(hubContextMock.Object);

        await service.SendReminderAlertAsync(42, "Don't forget!");

        clientProxyMock.Verify(
            c => c.SendCoreAsync(
                "ReceiveReminderAlert",
                It.Is<object[]>(args => args.Length == 1),
                default
            ),
            Times.Once
        );
    }
}